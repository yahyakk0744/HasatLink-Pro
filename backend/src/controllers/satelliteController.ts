import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { fromUrl } from 'geotiff';

// ─── Element84 Earth Search — FREE, no API key, no signup, unlimited ───
const STAC_URL = 'https://earth-search.aws.element84.com/v1/search';
const TKGM_BASE = 'https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api/parsel';

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

function bboxFromCoords(coords: number[][]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of coords) {
    if (c[0] < minX) minX = c[0];
    if (c[1] < minY) minY = c[1];
    if (c[0] > maxX) maxX = c[0];
    if (c[1] > maxY) maxY = c[1];
  }
  return [minX, minY, maxX, maxY];
}

/** Search Sentinel-2 L2A scenes via Element84 STAC (free, no auth) */
async function searchScenes(
  geometry: any,
  from: string,
  to: string,
  maxCloud = 80,
  limit = 30,
): Promise<any[]> {
  const { data } = await axios.post(STAC_URL, {
    collections: ['sentinel-2-l2a'],
    intersects: geometry,
    datetime: `${from}/${to}`,
    limit,
    query: { 'eo:cloud_cover': { lte: maxCloud } },
    sortby: [{ field: 'properties.eo:cloud_cover', direction: 'asc' }],
  }, { timeout: 15000 });
  return data?.features || [];
}

/** Read NDVI from Sentinel-2 COG bands (B04=Red, B08=NIR) — free, public S3 */
async function computeNDVI(
  redUrl: string,
  nirUrl: string,
  geoBbox: [number, number, number, number],
  sceneBbox: number[],
  projBbox: number[],
): Promise<{ min: number; max: number; mean: number; median: number } | null> {
  try {
    // Map geographic bbox to pixel coordinates using scene's geo↔proj mapping
    const [gMinX, gMinY, gMaxX, gMaxY] = geoBbox;
    const [sMinX, sMinY, sMaxX, sMaxY] = sceneBbox;
    const [pMinX, pMinY, pMaxX, pMaxY] = projBbox;

    // Linear interpolation: geo → proj
    const projLeft = pMinX + (gMinX - sMinX) / (sMaxX - sMinX) * (pMaxX - pMinX);
    const projRight = pMinX + (gMaxX - sMinX) / (sMaxX - sMinX) * (pMaxX - pMinX);
    const projBottom = pMinY + (gMinY - sMinY) / (sMaxY - sMinY) * (pMaxY - pMinY);
    const projTop = pMinY + (gMaxY - sMinY) / (sMaxY - sMinY) * (pMaxY - pMinY);

    const tiff = await fromUrl(redUrl);
    const image = await tiff.getImage();

    const [oX, oY] = image.getOrigin();
    const [rX, rY] = image.getResolution();
    const w = image.getWidth();
    const h = image.getHeight();

    // Convert proj coords to pixel coords
    let left = Math.floor((projLeft - oX) / rX);
    let top = Math.floor((projTop - oY) / rY);
    let right = Math.ceil((projRight - oX) / rX);
    let bottom = Math.ceil((projBottom - oY) / rY);

    // Clamp to image bounds
    left = Math.max(0, Math.min(w - 1, left));
    right = Math.max(left + 1, Math.min(w, right));
    top = Math.max(0, Math.min(h - 1, top));
    bottom = Math.max(top + 1, Math.min(h, bottom));

    // Read at reduced resolution (max 64x64 pixels = tiny download)
    const outW = Math.min(64, right - left);
    const outH = Math.min(64, bottom - top);

    const tiffNir = await fromUrl(nirUrl);
    const imageNir = await tiffNir.getImage();

    const [redData, nirData] = await Promise.all([
      image.readRasters({ window: [left, top, right, bottom], width: outW, height: outH }),
      imageNir.readRasters({ window: [left, top, right, bottom], width: outW, height: outH }),
    ]);

    const red = redData[0] as any;
    const nir = nirData[0] as any;
    const values: number[] = [];

    for (let i = 0; i < red.length; i++) {
      if (red[i] === 0 && nir[i] === 0) continue; // nodata
      const ndvi = (nir[i] - red[i]) / (nir[i] + red[i] + 0.0001);
      if (ndvi >= -1 && ndvi <= 1) values.push(ndvi);
    }

    if (values.length === 0) return null;
    values.sort((a, b) => a - b);

    return {
      min: values[0],
      max: values[values.length - 1],
      mean: values.reduce((s, v) => s + v, 0) / values.length,
      median: values[Math.floor(values.length / 2)],
    };
  } catch (err) {
    console.error('NDVI computation error:', err);
    return null;
  }
}

/** Get satellite image of exact polygon area from Esri World Imagery (free, no API key) */
async function getFieldImage(bbox: [number, number, number, number], width = 512): Promise<string | null> {
  try {
    // Esri export map — renders exact bbox as image
    const [minX, minY, maxX, maxY] = bbox;
    // Add 10% padding around the polygon
    const padX = (maxX - minX) * 0.1;
    const padY = (maxY - minY) * 0.1;
    const aspect = (maxX - minX + 2 * padX) / (maxY - minY + 2 * padY);
    const height = Math.round(width / Math.max(aspect, 0.5));

    const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${minX - padX},${minY - padY},${maxX + padX},${maxY + padY}&bboxSR=4326&imageSR=4326&size=${width},${height}&format=png&f=image`;

    const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return `data:image/png;base64,${Buffer.from(data).toString('base64')}`;
  } catch {
    return null;
  }
}

// ─── Route Handlers ───

/**
 * Quick satellite analysis — FREE, no API key needed
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
    const geoBbox = bboxFromCoords(coordinates);
    const areaHa = calcPolygonAreaHa(coordinates);

    // Time range: last 90 days
    const now = new Date();
    const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const to = now.toISOString();

    // 1. Search for clear Sentinel-2 scenes (FREE, no auth)
    const scenes = await searchScenes(geometry, from, to, 80, 30);

    if (scenes.length === 0) {
      res.json({
        center: { lat, lng },
        area: areaHa * 10000,
        latestNDVI: null,
        healthStatus: 'unknown',
        healthColor: '#6B6560',
        ndviHistory: [],
        images: [],
        renderedImages: {},
        clearImageCount: 0,
        totalImageCount: 0,
      });
      return;
    }

    // 2. Get satellite image of EXACT polygon area (Esri, free)
    const bestScene = scenes[0];

    // 3. Compute NDVI from the best scene's bands
    const redUrl = bestScene.assets?.red?.href || bestScene.assets?.B04?.href || '';
    const nirUrl = bestScene.assets?.nir?.href || bestScene.assets?.B08?.href || '';
    const sceneBbox = bestScene.bbox || [];
    const projBbox = bestScene.properties?.['proj:bbox'] || sceneBbox;

    // Run field image + NDVI computation in parallel
    const [trueColorBase64, latestNDVI] = await Promise.all([
      getFieldImage(geoBbox, 512),
      (redUrl && nirUrl && sceneBbox.length === 4)
        ? computeNDVI(redUrl, nirUrl, geoBbox, sceneBbox, projBbox)
        : Promise.resolve(null),
    ]);

    // 4. Compute NDVI history from multiple scenes (up to 10 for trend)
    const historyScenes = scenes.slice(0, 12);
    const ndviHistory: any[] = [];

    // Process history scenes sequentially to avoid overloading
    for (const scene of historyScenes) {
      const sRedUrl = scene.assets?.red?.href || scene.assets?.B04?.href || '';
      const sNirUrl = scene.assets?.nir?.href || scene.assets?.B08?.href || '';
      const sBbox = scene.bbox || [];
      const sProjBbox = scene.properties?.['proj:bbox'] || sBbox;

      if (sRedUrl && sNirUrl && sBbox.length === 4) {
        const stats = await computeNDVI(sRedUrl, sNirUrl, geoBbox, sBbox, sProjBbox);
        if (stats) {
          const dt = Math.floor(new Date(scene.properties?.datetime || '').getTime() / 1000);
          ndviHistory.push({
            dt,
            date: (scene.properties?.datetime || '').split('T')[0],
            ...stats,
          });
        }
      }
    }
    ndviHistory.sort((a, b) => a.dt - b.dt);

    // 5. Determine health status
    const ndviLatest = latestNDVI || (ndviHistory.length > 0 ? ndviHistory[ndviHistory.length - 1] : null);
    let healthStatus = 'unknown';
    let healthColor = '#6B6560';
    if (ndviLatest) {
      if (ndviLatest.mean >= 0.6) { healthStatus = 'excellent'; healthColor = '#059669'; }
      else if (ndviLatest.mean >= 0.4) { healthStatus = 'good'; healthColor = '#2D6A4F'; }
      else if (ndviLatest.mean >= 0.25) { healthStatus = 'moderate'; healthColor = '#D97706'; }
      else if (ndviLatest.mean >= 0.1) { healthStatus = 'poor'; healthColor = '#DC2626'; }
      else { healthStatus = 'critical'; healthColor = '#991B1B'; }
    }

    // 6. Build scene list for frontend
    const imageList = scenes.slice(0, 8).map((s: any) => ({
      dt: Math.floor(new Date(s.properties?.datetime || '').getTime() / 1000),
      date: (s.properties?.datetime || '').split('T')[0],
      cloudCoverage: s.properties?.['eo:cloud_cover'] ?? 100,
      platform: s.properties?.platform || 'sentinel-2',
    }));

    // 7. Build rendered images
    const renderedImages: Record<string, string> = {};
    if (trueColorBase64) renderedImages.trueColor = trueColorBase64;

    res.json({
      center: { lat, lng },
      area: areaHa * 10000,
      latestNDVI: ndviLatest,
      healthStatus,
      healthColor,
      ndviHistory,
      images: imageList,
      renderedImages,
      clearImageCount: imageList.filter((i: any) => i.cloudCoverage < 50).length,
      totalImageCount: imageList.length,
    });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Bilinmeyen hata';
    res.status(error.response?.status || 500).json({ message: `Analiz yapilamadi: ${msg}` });
  }
};

// ─── Legacy endpoints (removed — all-in-one /analyze is sufficient) ───
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
  res.status(410).json({ message: 'Bu endpoint kaldirildi.' });
};
export const deletePolygon = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(410).json({ message: 'Bu endpoint kaldirildi.' });
};

// ─── TKGM Parcel Query (unchanged) ───

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
  if (geometry?.type === 'Polygon') coordinates = geometry.coordinates;
  else if (geometry?.type === 'MultiPolygon') coordinates = geometry.coordinates[0];
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
    geometry: { type: geometry?.type || 'Polygon', coordinates },
  };
}
