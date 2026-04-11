import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { fromUrl } from 'geotiff';
import { deflateSync } from 'zlib';

// ─── Pure-JS PNG encoder (no external deps, uses built-in zlib) ───

const _crc32Table = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1);
    t.push(c >>> 0);
  }
  return t;
})();

function _crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = (crc >>> 8) ^ _crc32Table[(crc ^ b) & 0xFF];
  return ((crc ^ 0xFFFFFFFF) >>> 0);
}

function _pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(_crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([len, typeB, data, crcBuf]);
}

/** Encode an RGB pixel array as a PNG buffer (pure Node.js) */
function encodePNG(width: number, height: number, rgb: Uint8Array): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit depth, RGB color type
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3;
      const dst = y * (1 + width * 3) + 1 + x * 3;
      raw[dst] = rgb[src]; raw[dst + 1] = rgb[src + 1]; raw[dst + 2] = rgb[src + 2];
    }
  }
  return Buffer.concat([
    sig,
    _pngChunk('IHDR', ihdr),
    _pngChunk('IDAT', deflateSync(raw)),
    _pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Map NDVI value (-1..1) to an RGB color (standard vegetation color scale) */
function ndviToRGB(v: number): [number, number, number] {
  if (v < -0.05) return [50,  50,  160]; // water / shadow — blue
  if (v <  0.05) return [128, 128, 128]; // bare soil / rock — gray
  if (v <  0.15) return [210,  80,  40]; // very sparse — red
  if (v <  0.25) return [225, 140,  30]; // sparse — orange
  if (v <  0.35) return [230, 210,  30]; // low density — yellow
  if (v <  0.45) return [170, 210,  50]; // moderate — yellow-green
  if (v <  0.55) return [ 90, 175,  50]; // good — light green
  if (v <  0.65) return [ 40, 145,  35]; // very good — green
  return                 [ 10,  90,  20]; // excellent — dark green
}

/** Render a 2-D NDVI grid as a base64 PNG data URI */
function renderNDVIColorMap(
  ndviValues: number[],
  width: number,
  height: number,
  scaleTo = 256,
): string {
  // Scale up to scaleTo×scaleTo for visibility (nearest-neighbour)
  const scaleX = scaleTo / width;
  const scaleY = scaleTo / height;
  const outW = scaleTo;
  const outH = scaleTo;
  const rgb = new Uint8Array(outW * outH * 3);

  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const srcX = Math.min(width  - 1, Math.floor(ox / scaleX));
      const srcY = Math.min(height - 1, Math.floor(oy / scaleY));
      const ndvi = ndviValues[srcY * width + srcX] ?? 0;
      const [r, g, b] = ndviToRGB(ndvi);
      const i = (oy * outW + ox) * 3;
      rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = b;
    }
  }

  const png = encodePNG(outW, outH, rgb);
  return `data:image/png;base64,${png.toString('base64')}`;
}

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

type NDVIResult = { min: number; max: number; mean: number; median: number; grid?: { values: number[]; width: number; height: number } };

/** Read NDVI from Sentinel-2 COG bands (B04=Red, B08=NIR) — free, public S3 */
async function computeNDVI(
  redUrl: string,
  nirUrl: string,
  geoBbox: [number, number, number, number],
  sceneBbox: number[],
  projBbox: number[],
  returnGrid = false,
): Promise<NDVIResult | null> {
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

    const result: NDVIResult = {
      min: values[0],
      max: values[values.length - 1],
      mean: values.reduce((s, v) => s + v, 0) / values.length,
      median: values[Math.floor(values.length / 2)],
    };

    if (returnGrid) {
      // Build unsorted grid (ndvi per pixel in raster order)
      const grid: number[] = [];
      const totalPixels = outW * outH;
      const redArr = redData[0] as any;
      const nirArr = nirData[0] as any;
      for (let i = 0; i < totalPixels; i++) {
        if (redArr[i] === 0 && nirArr[i] === 0) {
          grid.push(0);
        } else {
          const v = (nirArr[i] - redArr[i]) / (nirArr[i] + redArr[i] + 0.0001);
          grid.push(Math.max(-1, Math.min(1, v)));
        }
      }
      result.grid = { values: grid, width: outW, height: outH };
    }

    return result;
  } catch (err) {
    console.error('NDVI computation error:', err);
    return null;
  }
}

/** Process items in batches of N concurrently (avoids S3 rate limiting) */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R | null>,
): Promise<(R | null)[]> {
  const results: (R | null)[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(fn));
    for (const r of settled) {
      results.push(r.status === 'fulfilled' ? r.value : null);
    }
  }
  return results;
}

/** Render false color composite from 3 Sentinel-2 bands (NIR=R, Red=G, Green=B) */
async function getFalseColorImage(
  nirUrl: string,   // B08 → Red channel
  redUrl: string,   // B04 → Green channel
  greenUrl: string, // B03 → Blue channel
  geoBbox: [number, number, number, number],
  sceneBbox: number[],
  projBbox: number[],
  scaleTo = 256,
): Promise<string | null> {
  try {
    const [gMinX, gMinY, gMaxX, gMaxY] = geoBbox;
    const [sMinX, sMinY, sMaxX, sMaxY] = sceneBbox;
    const [pMinX, pMinY, pMaxX, pMaxY] = projBbox;

    const projLeft   = pMinX + (gMinX - sMinX) / (sMaxX - sMinX) * (pMaxX - pMinX);
    const projRight  = pMinX + (gMaxX - sMinX) / (sMaxX - sMinX) * (pMaxX - pMinX);
    const projBottom = pMinY + (gMinY - sMinY) / (sMaxY - sMinY) * (pMaxY - pMinY);
    const projTop    = pMinY + (gMaxY - sMinY) / (sMaxY - sMinY) * (pMaxY - pMinY);

    const tiffNir = await fromUrl(nirUrl);
    const imageNir = await tiffNir.getImage();
    const [oX, oY] = imageNir.getOrigin();
    const [rX, rY] = imageNir.getResolution();
    const w = imageNir.getWidth();
    const h = imageNir.getHeight();

    let left   = Math.max(0, Math.min(w - 1, Math.floor((projLeft   - oX) / rX)));
    let top    = Math.max(0, Math.min(h - 1, Math.floor((projTop    - oY) / rY)));
    let right  = Math.max(left + 1, Math.min(w, Math.ceil((projRight  - oX) / rX)));
    let bottom = Math.max(top  + 1, Math.min(h, Math.ceil((projBottom - oY) / rY)));

    const outW = Math.min(64, right - left);
    const outH = Math.min(64, bottom - top);

    const tiffRed   = await fromUrl(redUrl);
    const imageRed  = await tiffRed.getImage();
    const tiffGreen = await fromUrl(greenUrl);
    const imageGreen = await tiffGreen.getImage();

    const window = { window: [left, top, right, bottom] as [number,number,number,number], width: outW, height: outH };
    const [nirData, redData, greenData] = await Promise.all([
      imageNir.readRasters(window),
      imageRed.readRasters(window),
      imageGreen.readRasters(window),
    ]);

    const nir   = nirData[0]   as any;
    const red   = redData[0]   as any;
    const green = greenData[0] as any;

    // Scale up to scaleTo×scaleTo (nearest neighbour)
    const scaleX = scaleTo / outW;
    const scaleY = scaleTo / outH;
    const rgb = new Uint8Array(scaleTo * scaleTo * 3);
    const STRETCH = 4000; // Sentinel-2 L2A typical max reflectance * 10000

    for (let oy = 0; oy < scaleTo; oy++) {
      for (let ox = 0; ox < scaleTo; ox++) {
        const sx = Math.min(outW - 1, Math.floor(ox / scaleX));
        const sy = Math.min(outH - 1, Math.floor(oy / scaleY));
        const src = sy * outW + sx;
        const dst = (oy * scaleTo + ox) * 3;
        rgb[dst]     = Math.min(255, Math.round((nir[src]   || 0) / STRETCH * 255)); // R = NIR
        rgb[dst + 1] = Math.min(255, Math.round((red[src]   || 0) / STRETCH * 255)); // G = Red
        rgb[dst + 2] = Math.min(255, Math.round((green[src] || 0) / STRETCH * 255)); // B = Green
      }
    }

    const png = encodePNG(scaleTo, scaleTo, rgb);
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (err) {
    console.error('FalseColor render error:', err);
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
    const redUrl   = bestScene.assets?.red?.href   || bestScene.assets?.B04?.href || '';
    const nirUrl   = bestScene.assets?.nir?.href   || bestScene.assets?.B08?.href || '';
    const greenUrl = bestScene.assets?.green?.href || bestScene.assets?.B03?.href || '';
    const sceneBbox = bestScene.bbox || [];
    const projBbox = bestScene.properties?.['proj:bbox'] || sceneBbox;

    // Run trueColor + NDVI + falseColor in parallel
    const [trueColorBase64, latestNDVI, falseColorBase64] = await Promise.all([
      getFieldImage(geoBbox, 512),
      (redUrl && nirUrl && sceneBbox.length === 4)
        ? computeNDVI(redUrl, nirUrl, geoBbox, sceneBbox, projBbox, true)
        : Promise.resolve(null),
      (nirUrl && redUrl && greenUrl && sceneBbox.length === 4)
        ? getFalseColorImage(nirUrl, redUrl, greenUrl, geoBbox, sceneBbox, projBbox, 256)
        : Promise.resolve(null),
    ]);

    // 4. Compute NDVI history in parallel batches (4x faster than sequential)
    const historyScenes = scenes.slice(0, 12);

    const historyResults = await processInBatches(historyScenes, 4, async (scene) => {
      const sRedUrl  = scene.assets?.red?.href  || scene.assets?.B04?.href || '';
      const sNirUrl  = scene.assets?.nir?.href  || scene.assets?.B08?.href || '';
      const sBbox    = scene.bbox || [];
      const sProjBbox = scene.properties?.['proj:bbox'] || sBbox;
      if (!sRedUrl || !sNirUrl || sBbox.length !== 4) return null;
      const stats = await computeNDVI(sRedUrl, sNirUrl, geoBbox, sBbox, sProjBbox, false);
      if (!stats) return null;
      const dt = Math.floor(new Date(scene.properties?.datetime || '').getTime() / 1000);
      return { dt, date: (scene.properties?.datetime || '').split('T')[0], ...stats };
    });

    const ndviHistory = historyResults.filter(Boolean) as any[];
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

    // NDVI color map — rendered from actual Sentinel-2 pixel data
    if (latestNDVI?.grid) {
      renderedImages.ndvi = renderNDVIColorMap(
        latestNDVI.grid.values,
        latestNDVI.grid.width,
        latestNDVI.grid.height,
        256,
      );
    }

    // False color composite (NIR=R, Red=G, Green=B) — healthy vegetation = bright red
    if (falseColorBase64) renderedImages.falseColor = falseColorBase64;

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
