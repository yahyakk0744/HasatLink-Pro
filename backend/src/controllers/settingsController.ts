import { Request, Response } from 'express';
import SiteSettings from '../models/SiteSettings';

// Whitelist of feature flag keys (used by toggleFeature + public getter)
const FEATURE_KEYS = [
  'featuredListing', 'bannerAds', 'dealerDirectory', 'sponsoredContent',
  'premiumMembership', 'jobListings', 'reportsSale', 'commission',
  'qnaForum', 'weatherAlerts', 'harvestCalendar', 'successStories',
  'referralProgram', 'voiceMessages', 'videoCall', 'broadcastMessages',
  'mapView', 'voiceSearch', 'logisticsDirectory', 'weeklyNewsletter',
  'telegramBot', 'priceForecast',
] as const;

type FeatureKey = typeof FEATURE_KEYS[number];

const isFeatureKey = (k: string): k is FeatureKey =>
  (FEATURE_KEYS as readonly string[]).includes(k);

// GET /api/settings — public (minimal, frontend için)
// Döner: sadece feature.enabled map + site bilgileri (fiyat gibi sensitive data yok)
export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    let settings = await SiteSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await SiteSettings.create({ key: 'main' });
    }

    const features: Record<string, boolean> = {};
    for (const key of FEATURE_KEYS) {
      const val = (settings as any)[key];
      features[key] = !!(val && val.enabled);
    }

    res.json({
      siteTitle: settings.siteTitle,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl,
      social: {
        facebook: settings.facebookUrl,
        instagram: settings.instagramUrl,
        twitter: settings.twitterUrl,
        linkedin: settings.linkedinUrl,
        youtube: settings.youtubeUrl,
      },
      features,
      maintenanceMode: settings.maintenanceMode || false,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ayarlar alınamadı', error });
  }
};

// GET /api/admin/settings — admin (full)
// Döner: tüm ayarlar, fiyatlar, paketler dahil.
export const getAdminSettings = async (_req: Request, res: Response): Promise<void> => {
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

// PUT /api/admin/settings — admin only (full update)
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = { ...req.body };
    delete body.key;
    delete body._id;
    delete body.__v;

    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Ayarlar güncellenemedi', error });
  }
};

// PATCH /api/admin/settings/feature/:name — tek toggle hızlı switch
// Body: { enabled: boolean }
export const toggleFeature = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = String(req.params.name || '');
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      res.status(400).json({ message: 'enabled boolean olmalı' });
      return;
    }
    if (!isFeatureKey(name)) {
      res.status(400).json({ message: 'Geçersiz özellik adı' });
      return;
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: { [`${name}.enabled`]: enabled } },
      { new: true, upsert: true }
    );

    res.json({ success: true, feature: name, enabled, settings });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Toggle güncellenemedi', error });
  }
};

// PATCH /api/admin/settings/maintenance — bakım modu toggle
// Body: { enabled: boolean }
export const toggleMaintenance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ message: 'enabled boolean olmalı' });
      return;
    }
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: { maintenanceMode: enabled } },
      { new: true, upsert: true }
    );
    res.json({ success: true, maintenanceMode: enabled, settings });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Bakım modu güncellenemedi', error });
  }
};
