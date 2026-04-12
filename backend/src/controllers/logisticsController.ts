import { Request, Response } from 'express';
import LogisticsProvider from '../models/LogisticsProvider';

// GET /api/logistics — list
export const getProviders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, coldChain, search, page = 1, limit = 20 } = req.query;
    const query: any = { isActive: true };
    if (city) {
      query.$or = [{ city }, { coverageAreas: city }];
    }
    if (coldChain === 'true') query.hasColdChain = true;
    if (search) {
      const re = { $regex: String(search), $options: 'i' };
      query.$or = [{ name: re }, { companyName: re }];
    }

    const p = Math.max(1, Number(page) || 1);
    const lim = Math.min(50, Math.max(5, Number(limit) || 20));
    const skip = (p - 1) * lim;

    const [providers, total] = await Promise.all([
      LogisticsProvider.find(query)
        .sort({ isVerified: -1, rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      LogisticsProvider.countDocuments(query),
    ]);

    res.json({ providers, total, page: p, limit: lim });
  } catch (err) {
    res.status(500).json({ message: 'Nakliyeciler yüklenemedi' });
  }
};

// GET /api/logistics/:id
export const getProvider = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = await LogisticsProvider.findById(req.params.id).lean();
    if (!provider) {
      res.status(404).json({ message: 'Bulunamadı' });
      return;
    }
    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: 'Yüklenemedi' });
  }
};

// POST /api/logistics/:id/contact — contactCount++
export const trackContact = async (req: Request, res: Response): Promise<void> => {
  try {
    await LogisticsProvider.findByIdAndUpdate(req.params.id, {
      $inc: { contactCount: 1 },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Takip edilemedi' });
  }
};

// Admin CRUD
export const createProvider = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = await LogisticsProvider.create(req.body);
    res.status(201).json(provider);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Oluşturulamadı' });
  }
};

export const updateProvider = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = await LogisticsProvider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!provider) {
      res.status(404).json({ message: 'Bulunamadı' });
      return;
    }
    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: 'Güncellenemedi' });
  }
};

export const deleteProvider = async (req: Request, res: Response): Promise<void> => {
  try {
    await LogisticsProvider.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Silinemedi' });
  }
};

// Mesafe hesaplayıcı (basit haversine)
// GET /api/logistics/distance?fromLat=..&fromLng=..&toLat=..&toLng=..&pricePerKm=..
export const calculateDistance = async (req: Request, res: Response): Promise<void> => {
  try {
    const fromLat = Number(req.query.fromLat);
    const fromLng = Number(req.query.fromLng);
    const toLat = Number(req.query.toLat);
    const toLng = Number(req.query.toLng);
    const pricePerKm = Number(req.query.pricePerKm) || 25; // TL/km default

    if (!fromLat || !fromLng || !toLat || !toLng) {
      res.status(400).json({ message: 'Koordinatlar gerekli' });
      return;
    }

    const R = 6371; // km
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(toLat - fromLat);
    const dLng = toRad(toLng - fromLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c);
    const estimatedPrice = Math.round(distanceKm * pricePerKm);

    res.json({ distanceKm, estimatedPrice, pricePerKm });
  } catch (err) {
    res.status(500).json({ message: 'Hesaplanamadı' });
  }
};
