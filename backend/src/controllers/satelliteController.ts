import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

// ─── Copernicus Data Space Ecosystem (CDSE) — Sentinel Hub APIs ───
const SH_AUTH_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const SH_PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';
const SH_CATALOG_URL = 'https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search';
const SH_STATS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/statistics';

const TKGM_BASE = 'https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api/parsel';

// ─── Token cache ───
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.token;
  }

  const clientId = process.env.SH_CLIENT_ID || '';
  const clientSecret = process.env.SH_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    throw new Error('SENTINEL_HUB_CREDENTIALS_MISSING');
  }

  const { data } = await axios.post(SH_AUTH_URL,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

// ─── Evalscripts ───
const EVALSCRIPT_TRUE_COLOR = `//VERSION=3
function setup() {
  return { input: ["B04","B03","B02","dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  return [2.5*s.B04, 2.5*s.B03, 2.5*s.B02, s.dataMask];
}`;

const EVALSCRIPT_NDVI = `//VERSION=3
function setup() {
  return { input: ["B04","B08","dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 0.0001);
  // Color ramp: red → yellow → green
  let r, g, b;
  if (ndvi < 0) { r=0.5; g=0; b=0; }
  else if (ndvi < 0.2) { r=0.8; g=0.2; b=0.1; }
  else if (ndvi < 0.4) { r=0.9; g=0.7; b=0.1; }
  else if (ndvi < 0.6) { r=0.5; g=0.8; b=0.2; }
  else { r=0.1; g=0.6; b=0.1; }
  return [r, g, b, s.dataMask];
}`;

const EVALSCRIPT_FALSE_COLOR = `//VERSION=3
function setup() {
  return { input: ["B08","B04","B03","dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  return [2.5*s.B08, 2.5*s.B04, 2.5*s.B03, s.dataMask];
}`;

const EVALSCRIPT_NDVI_STATS = `//VERSION=3
function setup() {
  return { input: ["B04","B08","dataMask"], output: [{ id: "ndvi", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1 }] };
}
function evaluatePixel(s) {
  return { ndvi: [(s.B08 - s.B04) / (s.B08 + s.B04 + 0.0001)], dataMask: [s.dataMask] };
}`;

// ─── Helpers ───

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

/** Get image from Sentinel Hub Process API, return as base64 data URL */
async function getProcessImage(
  token: string,
  geometry: any,
  evalscript: string,
  from: string,
  to: string,
  width = 512,
  height = 512,
  maxCloudCoverage = 100,
): Promise<Buffer> {
  const { data } = await axios.post(SH_PROCESS_URL, {
    input: {
      bounds: {
        geometry,
        properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
      },
      data: [{
        type: 'sentinel-2-l2a',
        dataFilter: {
          timeRange: { from, to },
          maxCloudCoverage,
        },
      }],
    },
    output: {
      width,
      height,
      responses: [{ identifier: 'default', format: { type: 'image/png' } }],
    },
    evalscript,
  }, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'arraybuffer',
  });
  return Buffer.from(data);
}

/** Search catalog for available Sentinel-2 scenes */
async function searchScenes(token: string, geometry: any, from: string, to: string, maxCloud = 80): Promise<any[]> {
  const { data } = await axios.post(SH_CATALOG_URL, {
    collections: ['sentinel-2-l2a'],
    datetime: `${from}/${to}`,
    intersects: geometry,
    limit: 50,
    filter: `eo:cloud_cover < ${maxCloud}`,
    'filter-lang': 'cql2-text',
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.features || [];
}

/** Get NDVI statistics over time using Statistical API */
async function getNDVIStatistics(token: string, geometry: any, from: string, to: string): Promise<any[]> {
  try {
    const { data } = await axios.post(SH_STATS_URL, {
      input: {
        bounds: {
          geometry,
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
        },
        data: [{
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: { from, to },
            maxCloudCoverage: 80,
          },
        }],
      },
      aggregation: {
        timeRange: { from, to },
        aggregationInterval: { of: 'P5D' },
        evalscript: EVALSCRIPT_NDVI_STATS,
        width: 100,
        height: 100,
      },
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.data || [];
  } catch {
    return [];
  }
}

// ─── Route Handlers ───

/**
 * Quick satellite analysis — stateless, no polygon creation needed
 * POST /api/satellite/analyze
 * Body: { lat, lng, radiusKm?, polygon?: [[lng,lat],...] }
 */
export const quickAnalyze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng, radiusKm = 0.5, polygon: customPolygon } = req.body;
    if (!lat || !lng) {
      res.status(400).json({ message: 'Koordinat (lat, lng) gerekli' });
      return;
    }

    // Build GeoJSON geometry
    let coordinates: number[][];
    if (customPolygon && Array.isArray(customPolygon) && customPolygon.length >= 3) {
      coordinates = [...customPolygon];
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coordinates.push(first);
      }
    } else {
      const r = Math.max(radiusKm, 0.05) / 111.32;
      const rLng = r / Math.cos(lat * Math.PI / 180);
      coordinates = [
        [lng - rLng, lat - r],
        [lng + rLng, lat - r],
        [lng + rLng, lat + r],
        [lng - rLng, lat + r],
        [lng - rLng, lat - r],
      ];
    }

    const geometry = { type: 'Polygon', coordinates: [coordinates] };
    const areaHa = calcPolygonAreaHa(coordinates);

    let token: string;
    try {
      token = await getAccessToken();
    } catch (err: any) {
      if (err.message === 'SENTINEL_HUB_CREDENTIALS_MISSING') {
        res.status(503).json({ message: 'Uydu servisi yapilandirmasi eksik (SH_CLIENT_ID / SH_CLIENT_SECRET). Yoneticiyle iletisime gecin.' });
      } else {
        res.status(503).json({ message: 'Uydu servisi baglantisi kurulamadi. Lutfen tekrar deneyin.' });
      }
      return;
    }

    // Time range: last 90 days
    const now = new Date();
    const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00Z';
    const to = now.toISOString().split('T')[0] + 'T23:59:59Z';

    // Run all requests in parallel
    const imgSize = Math.min(Math.max(Math.round(Math.sqrt(areaHa) * 100), 256), 1024);

    const [scenes, ndviStats, trueColorBuf, ndviBuf, falseColorBuf] = await Promise.all([
      searchScenes(token, geometry, from, to, 80).catch(() => []),
      getNDVIStatistics(token, geometry, from, to),
      getProcessImage(token, geometry, EVALSCRIPT_TRUE_COLOR, from, to, imgSize, imgSize, 30).catch(() => null),
      getProcessImage(token, geometry, EVALSCRIPT_NDVI, from, to, imgSize, imgSize, 30).catch(() => null),
      getProcessImage(token, geometry, EVALSCRIPT_FALSE_COLOR, from, to, imgSize, imgSize, 30).catch(() => null),
    ]);

    // Build image list from catalog scenes
    const images = scenes
      .sort((a: any, b: any) => (a.properties?.['eo:cloud_cover'] ?? 100) - (b.properties?.['eo:cloud_cover'] ?? 100))
      .slice(0, 8)
      .map((scene: any) => ({
        dt: Math.floor(new Date(scene.properties?.datetime || '').getTime() / 1000),
        date: (scene.properties?.datetime || '').split('T')[0],
        cloudCoverage: scene.properties?.['eo:cloud_cover'] ?? 100,
        platform: scene.properties?.['platform'] || 'sentinel-2',
      }));

    // Convert rendered images to base64 data URLs
    const renderedImages: Record<string, string> = {};
    if (trueColorBuf) renderedImages.trueColor = `data:image/png;base64,${trueColorBuf.toString('base64')}`;
    if (ndviBuf) renderedImages.ndvi = `data:image/png;base64,${ndviBuf.toString('base64')}`;
    if (falseColorBuf) renderedImages.falseColor = `data:image/png;base64,${falseColorBuf.toString('base64')}`;

    // Process NDVI statistics
    const ndviHistory = ndviStats
      .filter((entry: any) => entry.outputs?.ndvi?.bands?.B0?.stats)
      .map((entry: any) => {
        const stats = entry.outputs.ndvi.bands.B0.stats;
        return {
          dt: Math.floor(new Date(entry.interval.from).getTime() / 1000),
          date: entry.interval.from.split('T')[0],
          min: stats.min ?? 0,
          max: stats.max ?? 0,
          mean: stats.mean ?? 0,
          median: stats.median ?? stats.mean ?? 0,
        };
      })
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

    res.json({
      center: { lat, lng },
      area: areaHa * 10000, // m²
      latestNDVI: latest || null,
      healthStatus,
      healthColor,
      ndviHistory,
      images,
      renderedImages,
      clearImageCount: images.filter((i: any) => i.cloudCoverage < 50).length,
      totalImageCount: images.length,
    });
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      tokenCache = null; // Clear stale token
      res.status(503).json({ message: 'Uydu servisi yetkilendirme hatasi. API anahtarlari kontrol edilmeli.' });
    } else {
      const msg = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Bilinmeyen hata';
      res.status(status || 500).json({ message: `Analiz yapilamadi: ${msg}` });
    }
  }
};

// ─── Legacy Agromonitoring endpoints (kept for backward compat, can be removed) ───
export const createPolygon = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ message: 'Bu endpoint kaldirildi. /satellite/analyze kullanin.' });
};
export const getSatelliteImagery = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ message: 'Bu endpoint kaldirildi. /satellite/analyze kullanin.' });
};
export const getNDVIStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ message: 'Bu endpoint kaldirildi. /satellite/analyze kullanin.' });
};
export const listPolygons = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ message: 'Bu endpoint kaldirildi. /satellite/analyze kullanin.' });
};
export const deletePolygon = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ message: 'Bu endpoint kaldirildi.' });
};

// ─── TKGM Parcel Query (unchanged) ───

/**
 * Query TKGM cadastral parcel by coordinate
 * GET /api/satellite/parcel?lat=X&lng=Y
 */
export const getParcelByCoordinate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ message: 'lat ve lng parametreleri gerekli' });
      return;
    }

    const { data } = await axios.get(`${TKGM_BASE}/koordinat/${lng}/${lat}`, {
      headers: { 'User-Agent': 'HasatLink/1.0', 'Accept': 'application/json' },
      timeout: 10000,
    });

    if (!data || !data.features || data.features.length === 0) {
      try {
        const { data: altData } = await axios.get(`${TKGM_BASE}/koordinat`, {
          params: { x: lng, y: lat },
          headers: { 'User-Agent': 'HasatLink/1.0', 'Accept': 'application/json' },
          timeout: 10000,
        });
        if (altData?.features?.length > 0) {
          res.json(formatParcelResponse(altData.features[0]));
          return;
        }
      } catch {}
      res.status(404).json({ message: 'Bu koordinatta parsel bulunamadi' });
      return;
    }

    res.json(formatParcelResponse(data.features[0]));
  } catch (error: any) {
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
