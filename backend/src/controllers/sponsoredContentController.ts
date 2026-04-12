import { Request, Response } from 'express';
import SponsoredContent from '../models/SponsoredContent';

// GET /api/sponsored — list (sadece published + current)
export const getPublished = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const { category, limit = 20 } = req.query;
    const query: any = { published: true, startDate: { $lte: now } };
    query.$or = [{ endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } }];
    if (category) query.category = category;

    const items = await SponsoredContent.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 20)
      .lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: 'İçerik yüklenemedi' });
  }
};

// GET /api/sponsored/:slug
export const getBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await SponsoredContent.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { impressionCount: 1 } },
      { new: true }
    ).lean();
    if (!item) {
      res.status(404).json({ message: 'İçerik bulunamadı' });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Yüklenemedi' });
  }
};

// POST /api/sponsored/:id/click
export const trackClick = async (req: Request, res: Response): Promise<void> => {
  try {
    await SponsoredContent.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Takip edilemedi' });
  }
};

// Admin CRUD
export const getAllForAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await SponsoredContent.find().sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Liste yüklenemedi' });
  }
};

export const createSponsored = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await SponsoredContent.create(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Oluşturulamadı' });
  }
};

export const updateSponsored = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await SponsoredContent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) {
      res.status(404).json({ message: 'Bulunamadı' });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Güncellenemedi' });
  }
};

export const deleteSponsored = async (req: Request, res: Response): Promise<void> => {
  try {
    await SponsoredContent.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Silinemedi' });
  }
};
