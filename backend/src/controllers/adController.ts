import { Request, Response } from 'express';
import Ad from '../models/Ad';

// GET /api/ads/active?slot=X — public
export const getActiveAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const filter: Record<string, unknown> = {
      enabled: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };
    if (req.query.slot) filter.slot = req.query.slot;
    const ads = await Ad.find(filter).select('-clickCount -impressionCount');
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: 'Reklamlar alınamadı', error });
  }
};

// POST /api/ads/active/:id/impression — public
export const trackImpression = async (req: Request, res: Response): Promise<void> => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { impressionCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Gösterim kaydedilemedi', error });
  }
};

// POST /api/ads/active/:id/click — public
export const trackClick = async (req: Request, res: Response): Promise<void> => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Tıklama kaydedilemedi', error });
  }
};

// GET /api/admin/ads — admin
export const getAllAds = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: 'Reklamlar alınamadı', error });
  }
};

// POST /api/admin/ads — admin
export const createAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const ad = await Ad.create(req.body);
    res.status(201).json(ad);
  } catch (error) {
    res.status(500).json({ message: 'Reklam oluşturulamadı', error });
  }
};

// PUT /api/admin/ads/:id — admin
export const updateAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ad) { res.status(404).json({ message: 'Reklam bulunamadı' }); return; }
    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: 'Reklam güncellenemedi', error });
  }
};

// DELETE /api/admin/ads/:id — admin
export const deleteAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) { res.status(404).json({ message: 'Reklam bulunamadı' }); return; }
    res.json({ message: 'Reklam silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Reklam silinemedi', error });
  }
};
