import { Request, Response } from 'express';
import SiteSettings from '../models/SiteSettings';

// GET /api/settings — public
export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await SiteSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await SiteSettings.create({ key: 'main' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Ayarlar alınamadı', error });
  }
};

// PUT /api/admin/settings — admin only
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instagramUrl, twitterUrl } = req.body;
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { instagramUrl, twitterUrl },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Ayarlar güncellenemedi', error });
  }
};
