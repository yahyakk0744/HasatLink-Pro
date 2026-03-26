import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

const AGRO_API_KEY = () => process.env.AGROMONITORING_API_KEY || '';

/** Delete old QuickScan polygons, keep only the latest `keep` ones */
async function cleanupQuickScans(keepId?: string, keep = 3) {
  try {
    const { data: polygons } = await axios.get(`${AGRO_BASE}/polygons?appid=${AGRO_API_KEY()}`);
    if (!Array.isArray(polygons)) return;
    const quickScans = polygons.filter((p: any) => p.name?.startsWith('QuickScan-'));
    if (quickScans.length <= keep) return;
    const sorted = quickScans.sort((a: any, b: any) => (a.created_at || 0) - (b.created_at || 0));
    const toDelete = sorted.slice(0, sorted.length - keep);
    for (const p of toDelete) {
      if (p.id !== keepId) {
        await axios.delete(`${AGRO_BASE}/polygons/${p.id}?appid=${AGRO_API_KEY()}`).catch(() => {});
      }
    }
  } catch {}
}

/** Wait a bit and retry fetching data — new polygons need processing time */
async function fetchWithRetry<T>(url: string, params: Record<string, any>, retries = 2, delayMs = 1500): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data } = await axios.get<T>(url, { params });
      return data;
    } catch (err: any) {
      if (i === retries || (err.response?.status && err.response.status !== 404)) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Veri alinamadi');
}

/** Calculate polygon area in hectares using Shoelace formula (approximate) */
function calcPolygonAreaHa(coords: number[][]): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  let area = 0;
  const n = coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]
    ? coords.length - 1 : coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRad(coords[i][1]);
    const lat2 = toRad(coords[j][1]);
    const dLng = toRad(coords[j][0] - coords[i][0]);
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2) / 10000;
}
const AGRO_BASE = 'https://api.agromonitoring.com/agro/1.0';
const TKGM_BASE = 'https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api/parsel';

/**
 * Create a polygon (field) on Agromonitoring and return its id.
 * Free tier allows up to 10 polygons.
 * POST /api/satellite/polygon
 * Body: { name, coordinates: [[lng, lat], ...] }
 */
export const createPolygon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      res.status(400).json({ message: 'En az 3 koordinat noktasi gerekli' });
      return;
    }

    // Close the ring if not closed
    const ring = [...coordinates];
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push(first);
    }

    const { data } = await axios.post(`${AGRO_BASE}/polygons?appid=${AGRO_API_KEY()}`, {
      name: name || `Tarla-${Date.now()}`,
      geo_json: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
      },
    });

    res.json({
      polygonId: data.id,
      name: data.name,
      area: data.area,
      center: data.center,
    });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    res.status(error.response?.status || 500).json({ message: `Polygon olusturulamadi: ${msg}` });
  }
};

/**
 * Get satellite imagery list for a polygon.
 * GET /api/satellite/imagery/:polygonId
 * Query: ?start=timestamp&end=timestamp
 */
export const getSatelliteImagery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { polygonId } = req.params;
    // Default: last 30 days
    const now = Math.floor(Date.now() / 1000);
    const start = req.query.start ? Number(req.query.start) : now - 30 * 24 * 60 * 60;
    const end = req.query.end ? Number(req.query.end) : now;

    const { data } = await axios.get(`${AGRO_BASE}/image/search`, {
      params: {
        polyid: polygonId,
        start,
        end,
        appid: AGRO_API_KEY(),
      },
    });

    // Return sorted by date desc, with truecolor + NDVI urls
    const images = (data || []).map((img: any) => ({
      dt: img.dt,
      date: new Date(img.dt * 1000).toISOString().split('T')[0],
      type: img.type,
      cloudCoverage: img.cl,
      dataAvailable: img.dc,
      trueColor: img.image?.truecolor,
      ndvi: img.image?.ndvi,
      evi: img.image?.evi,
      stats: img.stats?.ndvi,
    })).sort((a: any, b: any) => b.dt - a.dt);

    res.json({ images, count: images.length });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    res.status(error.response?.status || 500).json({ message: `Uydu verisi alinamadi: ${msg}` });
  }
};

/**
 * Get NDVI statistics for a polygon at a specific date.
 * GET /api/satellite/ndvi/:polygonId
 * Query: ?start=timestamp&end=timestamp
 */
export const getNDVIStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { polygonId } = req.params;
    const now = Math.floor(Date.now() / 1000);
    const start = req.query.start ? Number(req.query.start) : now - 30 * 24 * 60 * 60;
    const end = req.query.end ? Number(req.query.end) : now;

    const { data } = await axios.get(`${AGRO_BASE}/ndvi/history`, {
      params: {
        polyid: polygonId,
        start,
        end,
        appid: AGRO_API_KEY(),
      },
    });

    const history = (data || []).map((entry: any) => ({
      dt: entry.dt,
      date: new Date(entry.dt * 1000).toISOString().split('T')[0],
      min: entry.data?.min ?? 0,
      max: entry.data?.max ?? 0,
      mean: entry.data?.mean ?? 0,
      median: entry.data?.median ?? 0,
      p25: entry.data?.p25 ?? 0,
      p75: entry.data?.p75 ?? 0,
    })).sort((a: any, b: any) => a.dt - b.dt);

    res.json({ history, count: history.length });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    res.status(error.response?.status || 500).json({ message: `NDVI verisi alinamadi: ${msg}` });
  }
};

/**
 * Quick analysis: create a rectangular polygon from center point + radius,
 * then get latest NDVI. All-in-one endpoint for simple usage.
 * POST /api/satellite/analyze
 * Body: { lat, lng, radiusKm? }
 */
export const quickAnalyze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng, radiusKm = 0.5, polygon: customPolygon } = req.body;
    if (!lat || !lng) {
      res.status(400).json({ message: 'Koordinat (lat, lng) gerekli' });
      return;
    }

    if (!AGRO_API_KEY()) {
      res.status(503).json({ message: 'Uydu analiz servisi yapilandirmasi eksik. Lutfen yoneticiyle iletisime gecin.' });
      return;
    }

    // Use parcel polygon if provided, otherwise create square from radius
    let coordinates: number[][];
    if (customPolygon && Array.isArray(customPolygon) && customPolygon.length >= 3) {
      coordinates = [...customPolygon];
      // Close the ring if not closed
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordinates.push(first);
      }

      // Agromonitoring requires min 1 hectare — if polygon too small, expand it
      const area = calcPolygonAreaHa(coordinates);
      if (area < 1.0) {
        // Scale up polygon from centroid to reach ~1.1 ha
        const scale = Math.sqrt(1.1 / area);
        const centLng = coordinates.reduce((s, c) => s + c[0], 0) / (coordinates.length - 1);
        const centLat = coordinates.reduce((s, c) => s + c[1], 0) / (coordinates.length - 1);
        coordinates = coordinates.map(c => [
          centLng + (c[0] - centLng) * scale,
          centLat + (c[1] - centLat) * scale,
        ]);
      }
    } else {
      // Ensure minimum ~1.1 ha with radius fallback
      const minRadiusKm = 0.06; // ~1.1 ha square
      const effectiveRadius = Math.max(radiusKm, minRadiusKm);
      const r = effectiveRadius / 111.32;
      const rLng = r / Math.cos(lat * Math.PI / 180);
      coordinates = [
        [lng - rLng, lat - r],
        [lng + rLng, lat - r],
        [lng + rLng, lat + r],
        [lng - rLng, lat + r],
        [lng - rLng, lat - r],
      ];
    }

    // 0. Cleanup old QuickScan polygons before creating new one
    await cleanupQuickScans(undefined, 3);

    // 1. Create polygon (duplicated=true to allow same-area re-analysis)
    const { data: polygon } = await axios.post(
      `${AGRO_BASE}/polygons?appid=${AGRO_API_KEY()}&duplicated=true`,
      {
        name: `QuickScan-${Date.now()}`,
        geo_json: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
        },
      },
    );

    const polyId = polygon.id;

    // 2. Get satellite images (last 90 days for better chance of clear images)
    const now = Math.floor(Date.now() / 1000);
    const start = now - 90 * 24 * 60 * 60;

    const [imgData, ndviData] = await Promise.all([
      fetchWithRetry<any[]>(`${AGRO_BASE}/image/search`, { polyid: polyId, start, end: now, appid: AGRO_API_KEY() }),
      fetchWithRetry<any[]>(`${AGRO_BASE}/ndvi/history`, { polyid: polyId, start, end: now, appid: AGRO_API_KEY() }),
    ]);

    // Process all images — separate clear from cloudy
    const allImages = (imgData || [])
      .map((img: any) => ({
        dt: img.dt,
        date: new Date(img.dt * 1000).toISOString().split('T')[0],
        cloudCoverage: img.cl ?? 100,
        trueColor: img.image?.truecolor?.replace('http://', 'https://') || '',
        ndvi: img.image?.ndvi?.replace('http://', 'https://') || '',
        evi: img.image?.evi?.replace('http://', 'https://') || '',
        falseColor: img.image?.false_color?.replace('http://', 'https://') || '',
      }))
      .filter((img: any) => img.trueColor); // must have trueColor URL

    // Priority: clear images first (< 50% cloud), then least cloudy
    const clearImages = allImages
      .filter((img: any) => img.cloudCoverage < 50)
      .sort((a: any, b: any) => a.cloudCoverage - b.cloudCoverage || b.dt - a.dt);

    const cloudyImages = allImages
      .filter((img: any) => img.cloudCoverage >= 50)
      .sort((a: any, b: any) => a.cloudCoverage - b.cloudCoverage);

    // Take best clear images first, fill with least cloudy if needed
    const images = [...clearImages, ...cloudyImages].slice(0, 8);

    const ndviHistory = (ndviData || [])
      .map((entry: any) => ({
        dt: entry.dt,
        date: new Date(entry.dt * 1000).toISOString().split('T')[0],
        min: entry.data?.min ?? 0,
        max: entry.data?.max ?? 0,
        mean: entry.data?.mean ?? 0,
        median: entry.data?.median ?? 0,
      }))
      .sort((a: any, b: any) => a.dt - b.dt);

    // Latest NDVI assessment
    const latest = ndviHistory[ndviHistory.length - 1];
    let healthStatus = 'unknown';
    let healthColor = '#6B6560';
    if (latest) {
      if (latest.mean >= 0.6) { healthStatus = 'excellent'; healthColor = '#059669'; }
      else if (latest.mean >= 0.4) { healthStatus = 'good'; healthColor = '#2D6A4F'; }
      else if (latest.mean >= 0.25) { healthStatus = 'moderate'; healthColor = '#D97706'; }
      else if (latest.mean >= 0.1) { healthStatus = 'poor'; healthColor = '#DC2626'; }
      else { healthStatus = 'critical'; healthColor = '#991B1B'; }
    }

    // Clean up old QuickScans in background, keep this one
    cleanupQuickScans(polyId, 3).catch(() => {});

    // Build static satellite map URL (Esri + polygon overlay) for preview
    const centerZoom = 15;
    const staticMapUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${centerZoom}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1 << centerZoom))}/${Math.floor((lng + 180) / 360 * (1 << centerZoom))}`;

    res.json({
      polygonId: polyId,
      center: { lat, lng },
      area: polygon.area,
      latestNDVI: latest || null,
      healthStatus,
      healthColor,
      ndviHistory,
      images,
      staticMapUrl,
      clearImageCount: images.filter((i: any) => i.cloudCoverage < 50).length,
      totalImageCount: allImages.length,
    });
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401) {
      res.status(503).json({ message: 'Uydu servisi API anahtari gecersiz veya suresi dolmus. Yonetici yeni anahtar tanimlamali.' });
    } else {
      // Extract readable error message — Agromonitoring may return string or object
      const rd = error.response?.data;
      const msg = typeof rd === 'string' ? rd
        : rd?.message || rd?.error || error.message || 'Bilinmeyen hata';
      res.status(status || 500).json({ message: `Analiz yapilamadi: ${msg}` });
    }
  }
};

/**
 * List user's polygons
 * GET /api/satellite/polygons
 */
export const listPolygons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data } = await axios.get(`${AGRO_BASE}/polygons?appid=${AGRO_API_KEY()}`);
    const polygons = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      area: p.area,
      center: p.center,
      createdAt: new Date(p.created_at * 1000).toISOString(),
    }));
    res.json({ polygons });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    res.status(error.response?.status || 500).json({ message: `Polygon listesi alinamadi: ${msg}` });
  }
};

/**
 * Delete a polygon
 * DELETE /api/satellite/polygon/:polygonId
 */
export const deletePolygon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { polygonId } = req.params;
    await axios.delete(`${AGRO_BASE}/polygons/${polygonId}?appid=${AGRO_API_KEY()}`);
    res.json({ message: 'Polygon silindi' });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    res.status(error.response?.status || 500).json({ message: `Polygon silinemedi: ${msg}` });
  }
};

/**
 * Query TKGM cadastral parcel by coordinate
 * GET /api/satellite/parcel?lat=X&lng=Y
 * Returns parcel info + polygon boundary from Turkey's Land Registry (TKGM)
 */
export const getParcelByCoordinate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ message: 'lat ve lng parametreleri gerekli' });
      return;
    }

    // TKGM API: koordinat ile parsel sorgulama
    const { data } = await axios.get(`${TKGM_BASE}/koordinat/${lng}/${lat}`, {
      headers: {
        'User-Agent': 'HasatLink/1.0',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    if (!data || !data.features || data.features.length === 0) {
      // Fallback: try alternative TKGM endpoint format
      try {
        const { data: altData } = await axios.get(`${TKGM_BASE}/koordinat`, {
          params: { x: lng, y: lat },
          headers: { 'User-Agent': 'HasatLink/1.0', 'Accept': 'application/json' },
          timeout: 10000,
        });
        if (altData?.features?.length > 0) {
          const feature = altData.features[0];
          res.json(formatParcelResponse(feature));
          return;
        }
      } catch {}

      res.status(404).json({ message: 'Bu koordinatta parsel bulunamadi' });
      return;
    }

    const feature = data.features[0];
    res.json(formatParcelResponse(feature));
  } catch (error: any) {
    // TKGM API unreachable — return helpful error
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      res.status(504).json({ message: 'TKGM servisi yanit vermiyor, lutfen tekrar deneyin' });
    } else {
      res.status(error.response?.status || 500).json({
        message: 'Parsel sorgulanamadi. TKGM servisi gecici olarak kullanilamiyor olabilir.',
      });
    }
  }
};

function formatParcelResponse(feature: any) {
  const props = feature.properties || {};
  const geometry = feature.geometry;

  // Convert coordinates to [lat, lng] format for Leaflet
  let coordinates: number[][][] = [];
  if (geometry?.type === 'Polygon') {
    coordinates = geometry.coordinates;
  } else if (geometry?.type === 'MultiPolygon') {
    coordinates = geometry.coordinates[0];
  }

  return {
    parcel: {
      il: props.il || props.IL || '',
      ilce: props.ilce || props.ILCE || '',
      mahalle: props.mahalle || props.MAHALLE || props.mapiMahalle || '',
      ada: props.ada || props.ADA || '',
      parsel: props.parsel || props.PARSEL || '',
      alan: props.alan || props.ALAN || 0,
      mevkii: props.mevkii || props.MEVKII || '',
      nitelik: props.nitelik || props.NITELIK || '',
      ozellekKod: props.ozellikKod || '',
    },
    geometry: {
      type: geometry?.type || 'Polygon',
      coordinates,
    },
  };
}
