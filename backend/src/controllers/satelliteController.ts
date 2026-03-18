import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

const AGRO_API_KEY = () => process.env.AGROMONITORING_API_KEY || '';
const AGRO_BASE = 'https://api.agromonitoring.com/agro/1.0';

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
    const { lat, lng, radiusKm = 0.5 } = req.body;
    if (!lat || !lng) {
      res.status(400).json({ message: 'Koordinat (lat, lng) gerekli' });
      return;
    }

    if (!AGRO_API_KEY()) {
      res.status(503).json({ message: 'Uydu analiz servisi yapilandirmasi eksik. Lutfen yoneticiyle iletisime gecin.' });
      return;
    }

    // Create a square polygon around the point
    const r = radiusKm / 111.32; // rough degree offset
    const rLng = r / Math.cos(lat * Math.PI / 180);
    const coordinates = [
      [lng - rLng, lat - r],
      [lng + rLng, lat - r],
      [lng + rLng, lat + r],
      [lng - rLng, lat + r],
      [lng - rLng, lat - r],
    ];

    // 1. Create polygon
    const { data: polygon } = await axios.post(`${AGRO_BASE}/polygons?appid=${AGRO_API_KEY()}`, {
      name: `QuickScan-${Date.now()}`,
      geo_json: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      },
    });

    const polyId = polygon.id;

    // 2. Get satellite images (last 30 days)
    const now = Math.floor(Date.now() / 1000);
    const start = now - 30 * 24 * 60 * 60;

    const [imgRes, ndviRes] = await Promise.all([
      axios.get(`${AGRO_BASE}/image/search`, {
        params: { polyid: polyId, start, end: now, appid: AGRO_API_KEY() },
      }),
      axios.get(`${AGRO_BASE}/ndvi/history`, {
        params: { polyid: polyId, start, end: now, appid: AGRO_API_KEY() },
      }),
    ]);

    const images = (imgRes.data || [])
      .map((img: any) => ({
        dt: img.dt,
        date: new Date(img.dt * 1000).toISOString().split('T')[0],
        cloudCoverage: img.cl,
        trueColor: img.image?.truecolor,
        ndvi: img.image?.ndvi,
      }))
      .sort((a: any, b: any) => b.dt - a.dt);

    const ndviHistory = (ndviRes.data || [])
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

    // Clean up polygon after analysis (free tier: max 10 polygons)
    axios.delete(`${AGRO_BASE}/polygons/${polyId}?appid=${AGRO_API_KEY()}`).catch(() => {});

    res.json({
      polygonId: polyId,
      center: { lat, lng },
      area: polygon.area,
      latestNDVI: latest || null,
      healthStatus,
      healthColor,
      ndviHistory,
      images: images.slice(0, 5),
    });
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401) {
      res.status(503).json({ message: 'Uydu servisi API anahtari gecersiz veya suresi dolmus. Yonetici yeni anahtar tanimlamali.' });
    } else {
      const msg = error.response?.data?.message || error.message;
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
