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
    const {
      instagramUrl,
      twitterUrl,
      featuredListing,
      premiumMembership,
      commission,
      aiUsageLimit,
    } = req.body;

    const update: Record<string, unknown> = {};
    if (instagramUrl !== undefined) update.instagramUrl = instagramUrl;
    if (twitterUrl !== undefined) update.twitterUrl = twitterUrl;
    if (featuredListing !== undefined) update.featuredListing = featuredListing;
    if (premiumMembership !== undefined) update.premiumMembership = premiumMembership;
    if (commission !== undefined) update.commission = commission;
    if (aiUsageLimit !== undefined) update.aiUsageLimit = aiUsageLimit;

    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      update,
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Ayarlar güncellenemedi', error });
  }
};
