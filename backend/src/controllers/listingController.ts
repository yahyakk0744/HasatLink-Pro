import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Listing from '../models/Listing';
import User from '../models/User';
import AIDiagnosis from '../models/AIDiagnosis';
import Comment from '../models/Comment';
import ListingView from '../models/ListingView';
import ListingShare from '../models/ListingShare';
import { checkFieldsForProfanity } from '../utils/profanityFilter';
import ProfanityLog from '../models/ProfanityLog';
import { awardPoints, POINT_VALUES } from '../utils/pointsService';

export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, type, subCategory, status, listingMode, page = '1', limit = '20', city, minPrice, maxPrice, sort } = req.query;
    const filter: any = {};
    if (type) filter.type = type;
    if (listingMode) filter.listingMode = listingMode;
    if (subCategory) filter.subCategory = subCategory;
    if (status) filter.status = status;
    else filter.status = 'active';
    if (city) {
      const escapedCity = (city as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.location = { $regex: escapedCity, $options: 'i' };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      const escaped = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'cheapest') sortOption = { price: 1 };
    else if (sort === 'expensive') sortOption = { price: -1 };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [listings, total] = await Promise.all([
      Listing.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit as string)).lean(),
      Listing.countDocuments(filter),
    ]);

    // Populate seller info
    const userIds = [...new Set(listings.map((l: any) => l.userId))];
    const users = await User.find({ userId: { $in: userIds } }).select('userId name profileImage averageRating isVerified trust_score points').lean();
    const userMap = new Map(users.map((u: any) => [u.userId, u]));
    const enriched = listings.map((l: any) => {
      const seller = userMap.get(l.userId);
      return { ...l, sellerName: seller?.name || '', sellerImage: seller?.profileImage || '', sellerRating: seller?.averageRating || 0, sellerVerified: (seller as any)?.isVerified || false, sellerTrustScore: (seller as any)?.trust_score || 0, sellerPoints: (seller as any)?.points || 0 };
    });

    res.json({ listings: enriched, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    res.status(500).json({ message: 'İlan listesi hatası', error });
  }
};

export const getListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }

    const identifier = (req as AuthRequest).userId || req.ip || 'unknown';
    try {
      await ListingView.create({ listingId: listing._id.toString(), identifier });
      listing.stats.views += 1;
      await listing.save();
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
      // Duplicate view — skip increment
    }

    // Attach seller info
    const [seller, sellerListingCount] = await Promise.all([
      User.findOne({ userId: listing.userId }).select('name profileImage averageRating totalRatings isVerified trust_score points createdAt').lean(),
      Listing.countDocuments({ userId: listing.userId, status: 'active' }),
    ]);
    const listingObj = listing.toObject();
    res.json({
      ...listingObj,
      sellerName: seller?.name || '',
      sellerImage: seller?.profileImage || '',
      sellerRating: seller?.averageRating || 0,
      sellerTotalRatings: seller?.totalRatings || 0,
      sellerVerified: seller?.isVerified || false,
      sellerTrustScore: seller?.trust_score || 0,
      sellerPoints: (seller as any)?.points || 0,
      sellerListingCount,
      sellerJoinDate: seller?.createdAt || '',
    });
  } catch (error) {
    res.status(500).json({ message: 'İlan detay hatası', error });
  }
};

export const createListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const profaneField = checkFieldsForProfanity({ title: req.body.title, description: req.body.description });
    if (profaneField) {
      ProfanityLog.create({ userId: (req as any).userId || '', field: profaneField, content: req.body[profaneField]?.substring(0, 200) || '', endpoint: 'createListing' }).catch(() => {});
      res.status(400).json({ message: 'Uygunsuz içerik tespit edildi, lütfen düzenleyin' });
      return;
    }
    const listing = await Listing.create({ ...req.body, userId: (req as any).userId || req.body.userId });

    // Award points for new listing
    awardPoints(listing.userId, POINT_VALUES.NEW_LISTING);

    // Check price alerts
    try {
      const PriceAlert = require('../models/PriceAlert').default;
      const Notification = require('../models/Notification').default;
      const { sendSocketNotification } = require('../socket');
      const { sendPushToUser } = require('../utils/pushNotification');

      const matchingAlerts = await PriceAlert.find({
        category: listing.type,
        isActive: true,
        targetPrice: { $gte: listing.price },
        userId: { $ne: listing.userId },
      });

      for (const alert of matchingAlerts) {
        const notif = await Notification.create({
          userId: alert.userId,
          type: 'ilan',
          title: 'Firsat Yakalandi!',
          message: `"${listing.title}" - ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(listing.price)} (Hedef: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(alert.targetPrice)})`,
          relatedId: listing._id.toString(),
        });
        sendSocketNotification(alert.userId, {
          _id: notif._id,
          type: 'ilan',
          title: notif.title,
          message: notif.message,
          relatedId: listing._id.toString(),
          playSound: true,
        });
        sendPushToUser(alert.userId, { title: notif.title, body: notif.message, url: `/ilan/${listing._id}` }, notif);
      }
    } catch {}

    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: 'İlan oluşturma hatası', error });
  }
};

export const updateListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }
    if ((req as AuthRequest).userId !== listing.userId) {
      res.status(403).json({ message: 'Bu ilanı düzenleme yetkiniz yok' });
      return;
    }
    const profaneField = checkFieldsForProfanity({ title: req.body.title, description: req.body.description });
    if (profaneField) {
      ProfanityLog.create({ userId: (req as AuthRequest).userId || '', field: profaneField, content: req.body[profaneField]?.substring(0, 200) || '', endpoint: 'updateListing' }).catch(() => {});
      res.status(400).json({ message: 'Uygunsuz içerik tespit edildi, lütfen düzenleyin' });
      return;
    }
    const oldPrice = listing.price;
    Object.assign(listing, req.body);
    await listing.save();

    // Price drop alert
    if (req.body.price && Number(req.body.price) < oldPrice) {
      try {
        const PriceAlert = require('../models/PriceAlert').default;
        const Notification = require('../models/Notification').default;
        const { sendSocketNotification } = require('../socket');
        const { sendPushToUser } = require('../utils/pushNotification');

        const matchingAlerts = await PriceAlert.find({
          category: listing.type,
          isActive: true,
          targetPrice: { $gte: Number(req.body.price) },
          userId: { $ne: listing.userId },
        });

        for (const alert of matchingAlerts) {
          const notif = await Notification.create({
            userId: alert.userId,
            type: 'ilan',
            title: 'Fiyat Dustu!',
            message: `"${listing.title}" fiyati ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(oldPrice)} → ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(req.body.price))}`,
            relatedId: listing._id.toString(),
          });
          sendSocketNotification(alert.userId, {
            _id: notif._id,
            type: 'ilan',
            title: notif.title,
            message: notif.message,
            relatedId: listing._id.toString(),
            playSound: true,
          });
          sendPushToUser(alert.userId, { title: notif.title, body: notif.message, url: `/ilan/${listing._id}` }, notif);
        }
      } catch {}
    }

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'İlan güncelleme hatası', error });
  }
};

export const deleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }
    if ((req as AuthRequest).userId !== listing.userId) {
      res.status(403).json({ message: 'Bu ilanı silme yetkiniz yok' });
      return;
    }
    await listing.deleteOne();
    await Comment.deleteMany({ listingId: listing._id.toString() });
    res.json({ message: 'İlan silindi' });
  } catch (error) {
    res.status(500).json({ message: 'İlan silme hatası', error });
  }
};

export const waClick = async (req: Request, res: Response): Promise<void> => {
  try {
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { 'stats.whatsappClicks': 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

export const shareListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId!;
    try {
      await new ListingShare({ listingId: req.params.id, userId }).save();
      await Listing.findByIdAndUpdate(req.params.id, { $inc: { 'stats.shares': 1 } });
      res.json({ success: true });
    } catch (err: any) {
      if (err?.code === 11000) {
        res.json({ success: true, alreadyShared: true });
      } else {
        throw err;
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

export const getMarketAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, city, subCategory } = req.query;
    if (!type) { res.status(400).json({ message: 'type is required' }); return; }

    const filter: any = { type, status: 'active' };
    if (city) {
      const escapedCity = (city as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.location = { $regex: escapedCity, $options: 'i' };
    }
    if (subCategory) filter.subCategory = subCategory;

    const result = await Listing.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent price trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [recentAvg, olderAvg] = await Promise.all([
      Listing.aggregate([
        { $match: { ...filter, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, avg: { $avg: '$price' } } },
      ]),
      Listing.aggregate([
        { $match: { ...filter, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $group: { _id: null, avg: { $avg: '$price' } } },
      ]),
    ]);

    const recentPrice = recentAvg[0]?.avg || 0;
    const olderPrice = olderAvg[0]?.avg || 0;
    const trend = olderPrice > 0 ? ((recentPrice - olderPrice) / olderPrice) * 100 : 0;

    const stats = result[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0, count: 0 };
    res.json({
      avgPrice: Math.round(stats.avgPrice),
      minPrice: stats.minPrice,
      maxPrice: stats.maxPrice,
      count: stats.count,
      trend: Math.round(trend * 10) / 10,
      city: city || '',
    });
  } catch (error) {
    res.status(500).json({ message: 'Market analytics hatasi', error });
  }
};

export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [activeListings, registeredUsers, aiDiagnoses, citiesResult, categoryAgg] = await Promise.all([
      Listing.countDocuments({ status: 'active' }),
      User.countDocuments(),
      AIDiagnosis.countDocuments(),
      User.distinct('location'),
      Listing.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);
    const cities = new Set(
      citiesResult
        .map((loc: string) => loc?.split(',').pop()?.trim())
        .filter(Boolean)
    );
    const categoryCounts: Record<string, number> = {};
    for (const item of categoryAgg) {
      if (item._id) categoryCounts[item._id] = item.count;
    }
    res.json({
      activeListings,
      registeredUsers,
      cities: Math.max(cities.size, 1),
      aiDiagnoses,
      categoryCounts,
    });
  } catch (error) {
    res.status(500).json({ message: 'İstatistik hatası', error });
  }
};
