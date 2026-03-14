import { Request, Response } from 'express';
import User from '../models/User';
import Listing from '../models/Listing';
import ContactMessage from '../models/ContactMessage';
import MarketPrice from '../models/MarketPrice';
import Ad from '../models/Ad';
import Notification from '../models/Notification';
import Comment from '../models/Comment';
import Report from '../models/Report';
import ProfanityLog from '../models/ProfanityLog';
import Rating from '../models/Rating';
import { sendPushToUser } from '../utils/pushNotification';
import { awardPoints, POINT_VALUES } from '../utils/pointsService';
import ListingView from '../models/ListingView';

// GET /api/admin/stats — dashboard stats
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalListings,
      activeListings,
      totalContacts,
      unreadContacts,
      totalAds,
      activeAds,
      bannedUsers,
      verifiedUsers,
      suspendedUsers,
      featuredListings,
      pendingListings,
      totalReports,
      pendingReports,
      totalProfanityLogs,
    ] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      Ad.countDocuments(),
      Ad.countDocuments({ enabled: true }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isSuspended: true }),
      Listing.countDocuments({ isFeatured: true }),
      Listing.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      ProfanityLog.countDocuments(),
    ]);

    const listingsByType = await Listing.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const recentListings = await Listing.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type status createdAt userId');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email username createdAt role isBanned');

    res.json({
      totalUsers,
      totalListings,
      activeListings,
      totalContacts,
      unreadContacts,
      totalAds,
      activeAds,
      bannedUsers,
      verifiedUsers,
      suspendedUsers,
      featuredListings,
      pendingListings,
      totalReports,
      pendingReports,
      totalProfanityLogs,
      listingsByType,
      recentListings,
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'İstatistikler alınamadı', error });
  }
};

// GET /api/admin/listings — list all listings
export const getAdminListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const search = req.query.search as string;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Listing.countDocuments(filter),
    ]);

    res.json({ listings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'İlanlar alınamadı', error });
  }
};

// PUT /api/admin/listings/:id/status — change listing status
export const updateListingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['active', 'pending', 'sold', 'rented', 'closed'].includes(status)) {
      res.status(400).json({ message: 'Geçersiz durum' });
      return;
    }
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'Durum güncellenemedi', error });
  }
};

// DELETE /api/admin/listings/:id — admin delete listing
export const deleteAdminListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }
    res.json({ message: 'İlan silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Silme başarısız', error });
  }
};

// GET /api/admin/users — list all users
export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const banned = req.query.banned as string;
    const verified = req.query.verified as string;

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (banned === 'true') filter.isBanned = true;
    if (verified === 'true') filter.isVerified = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-password'),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcılar alınamadı', error });
  }
};

// PUT /api/admin/users/:userId/ban — ban/unban user
export const toggleBanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    if (user.role === 'admin') {
      res.status(403).json({ message: 'Admin kullanıcı engellenemez' });
      return;
    }
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ userId: user.userId, isBanned: user.isBanned });
  } catch (error) {
    res.status(500).json({ message: 'İşlem başarısız', error });
  }
};

// PUT /api/admin/users/:userId/verify — verify/unverify user
export const toggleVerifyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    const wasVerified = user.isVerified;
    user.isVerified = !user.isVerified;
    await user.save();
    // Award/revoke points for verification
    if (!wasVerified && user.isVerified) {
      awardPoints(user.userId, POINT_VALUES.PROFILE_VERIFIED);
    } else if (wasVerified && !user.isVerified) {
      awardPoints(user.userId, -POINT_VALUES.PROFILE_VERIFIED);
    }
    res.json({ userId: user.userId, isVerified: user.isVerified });
  } catch (error) {
    res.status(500).json({ message: 'İşlem başarısız', error });
  }
};

// DELETE /api/admin/users/:userId — admin delete user
export const deleteAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    if (user.role === 'admin') {
      res.status(403).json({ message: 'Admin kullanıcı silinemez' });
      return;
    }
    await User.deleteOne({ userId: req.params.userId });
    await Listing.deleteMany({ userId: req.params.userId });
    res.json({ message: 'Kullanıcı ve ilanları silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Silme başarısız', error });
  }
};

// GET /api/admin/market-prices — list all hal prices
export const getAdminMarketPrices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const prices = await MarketPrice.find().sort({ category: 1, name: 1 });
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: 'Fiyatlar alınamadı', error });
  }
};

// POST /api/admin/market-prices — add market price
export const createMarketPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, nameEn, price, unit, category } = req.body;
    if (!name || !nameEn || price === undefined) {
      res.status(400).json({ message: 'Ad, İngilizce ad ve fiyat zorunludur' });
      return;
    }
    const mp = await MarketPrice.create({
      name,
      nameEn,
      price,
      previousPrice: price,
      change: 0,
      unit: unit || '₺/kg',
      category: category || 'sebze',
    });
    res.status(201).json(mp);
  } catch (error) {
    res.status(500).json({ message: 'Fiyat eklenemedi', error });
  }
};

// PUT /api/admin/market-prices/:id — update market price
export const updateMarketPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await MarketPrice.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ message: 'Fiyat bulunamadı' });
      return;
    }

    const { name, nameEn, price, unit, category } = req.body;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (nameEn !== undefined) update.nameEn = nameEn;
    if (price !== undefined) {
      update.previousPrice = existing.price;
      update.price = price;
      update.change = existing.price > 0 ? ((price - existing.price) / existing.price) * 100 : 0;
    }
    if (unit !== undefined) update.unit = unit;
    if (category !== undefined) update.category = category;
    update.updatedAt = new Date();

    const mp = await MarketPrice.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(mp);
  } catch (error) {
    res.status(500).json({ message: 'Fiyat güncellenemedi', error });
  }
};

// DELETE /api/admin/market-prices/:id — delete market price
export const deleteMarketPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const mp = await MarketPrice.findByIdAndDelete(req.params.id);
    if (!mp) {
      res.status(404).json({ message: 'Fiyat bulunamadı' });
      return;
    }
    res.json({ message: 'Fiyat silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Silme başarısız', error });
  }
};

// POST /api/admin/notifications/broadcast — send notification to all or selected users
export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, message, type, userIds, city, category: _category } = req.body;
    if (!title || !message) {
      res.status(400).json({ message: 'Başlık ve mesaj zorunludur' });
      return;
    }

    const notifType = type || 'sistem';

    // If userIds provided, send to specific users; otherwise check city filter; otherwise send to all
    let targetUsers: { userId: string }[];
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUsers = userIds.map((id: string) => ({ userId: id }));
    } else if (city && typeof city === 'string' && city.trim().length > 0) {
      targetUsers = await User.find({
        location: { $regex: city.trim(), $options: 'i' },
      }).select('userId').lean();
    } else {
      targetUsers = await User.find().select('userId').lean();
    }

    let sentCount = 0;
    for (const u of targetUsers) {
      try {
        const notif = await Notification.create({
          userId: u.userId,
          type: notifType,
          title,
          message,
        });
        sendPushToUser(u.userId, { title, body: message, url: '/' }, notif);
        sentCount++;
      } catch {
        // Skip failed individual notifications
      }
    }

    res.json({ success: true, sentCount, totalTargeted: targetUsers.length });
  } catch (error) {
    res.status(500).json({ message: 'Bildirim gönderilemedi', error });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/stats/enhanced — enhanced stats for dashboard charts
export const getEnhancedStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || '30d';
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // User registrations grouped by day
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);

    // Listing creations grouped by day
    const listingCreations = await Listing.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);

    // Category distribution (listings by type)
    const categoryDistribution = await Listing.aggregate([
      { $group: { _id: '$type', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
      { $sort: { value: -1 } },
    ]);

    // City distribution — top 10 cities from user locations
    // Location is stored as comma-separated string; take the last part as city
    const cityDistribution = await User.aggregate([
      { $match: { location: { $ne: '' } } },
      {
        $project: {
          cityParts: { $split: ['$location', ','] },
        },
      },
      {
        $project: {
          city: {
            $trim: {
              input: { $arrayElemAt: ['$cityParts', { $subtract: [{ $size: '$cityParts' }, 1] }] },
            },
          },
        },
      },
      { $match: { city: { $ne: '' } } },
      { $group: { _id: '$city', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: '$_id', value: 1 } },
    ]);

    res.json({
      userRegistrations,
      listingCreations,
      categoryDistribution,
      cityDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gelişmiş istatistikler alınamadı', error });
  }
};

// GET /api/admin/users/:userId/detail — get user detail with counts
export const getUserDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const [listingCount, commentCount] = await Promise.all([
      Listing.countDocuments({ userId: req.params.userId }),
      Comment.countDocuments({ userId: req.params.userId }),
    ]);

    res.json({ user, listingCount, commentCount });
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcı detayı alınamadı', error });
  }
};

// PUT /api/admin/users/:userId/suspend — toggle suspend user
export const toggleSuspendUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    if (user.role === 'admin') {
      res.status(403).json({ message: 'Admin kullanıcı askıya alınamaz' });
      return;
    }
    (user as any).isSuspended = !(user as any).isSuspended;
    await user.save();
    res.json({ userId: user.userId, isSuspended: (user as any).isSuspended });
  } catch (error) {
    res.status(500).json({ message: 'İşlem başarısız', error });
  }
};

// PUT /api/admin/listings/:id/feature — toggle feature listing
export const toggleFeatureListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }
    (listing as any).isFeatured = !(listing as any).isFeatured;
    await listing.save();
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'İşlem başarısız', error });
  }
};

// POST /api/admin/listings/bulk-delete — bulk delete listings
export const bulkDeleteListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Silinecek ilan IDleri gereklidir' });
      return;
    }
    const result = await Listing.deleteMany({ _id: { $in: ids } });
    res.json({ deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Toplu silme başarısız', error });
  }
};

// GET /api/admin/reports — list reports with pagination
export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    res.json({ reports, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Raporlar alınamadı', error });
  }
};

// POST /api/admin/reports — create a report (also used from public routes)
export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, reason, description } = req.body;
    const reporterUserId = (req as any).userId;

    if (!targetType || !targetId || !reason) {
      res.status(400).json({ message: 'targetType, targetId ve reason zorunludur' });
      return;
    }

    const report = await Report.create({
      reporterUserId,
      targetType,
      targetId,
      reason,
      description: description || '',
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Rapor oluşturulamadı', error });
  }
};

// PUT /api/admin/reports/:id — resolve or dismiss a report
export const resolveReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      res.status(400).json({ message: 'Geçersiz durum. resolved veya dismissed olmalıdır' });
      return;
    }

    const resolvedBy = (req as any).userId;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, resolvedBy },
      { new: true }
    );

    if (!report) {
      res.status(404).json({ message: 'Rapor bulunamadı' });
      return;
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Rapor güncellenemedi', error });
  }
};

// DELETE /api/admin/reports/:id — delete a report
export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      res.status(404).json({ message: 'Rapor bulunamadı' });
      return;
    }
    res.json({ message: 'Rapor silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Silme başarısız', error });
  }
};

// GET /api/admin/profanity-logs — list profanity logs with pagination
export const getProfanityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [logs, total] = await Promise.all([
      ProfanityLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ProfanityLog.countDocuments(),
    ]);

    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Küfür logları alınamadı', error });
  }
};

// GET /api/admin/notifications/history — get notification history
export const getNotificationHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('title message type createdAt');

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Bildirim geçmişi alınamadı', error });
  }
};

// GET /api/admin/ratings — list all ratings for moderation
// PUT /api/admin/users/:userId/points — manual point adjustment
export const adjustUserPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount === 0) {
      res.status(400).json({ message: 'Gecerli bir puan miktari girin' });
      return;
    }
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanici bulunamadi' });
      return;
    }
    user.points = Math.max(0, (user.points || 0) + amount);
    await user.save();
    res.json({ userId: user.userId, points: user.points });
  } catch (error) {
    res.status(500).json({ message: 'Puan guncelleme hatasi', error });
  }
};

export const getAdminRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [ratings, total] = await Promise.all([
      Rating.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Rating.countDocuments(),
    ]);
    res.json({ ratings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Değerlendirmeler alınamadı', error });
  }
};

// GET /api/admin/stats/daily-visitors — daily unique visitors from ListingView
export const getDailyVisitors = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const dailyVisitors = await ListingView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            identifier: '$identifier',
          },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          uniqueVisitors: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', uniqueVisitors: 1 } },
    ]);

    const totalViewsPerDay = await ListingView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalViews: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', totalViews: 1 } },
    ]);

    // Merge unique visitors and total views
    const viewsMap = new Map(totalViewsPerDay.map((v: any) => [v.date, v.totalViews]));
    const merged = dailyVisitors.map((d: any) => ({
      date: d.date,
      uniqueVisitors: d.uniqueVisitors,
      totalViews: viewsMap.get(d.date) || 0,
    }));

    const totalUniqueAllTime = await ListingView.distinct('identifier').then(ids => ids.length);

    res.json({ daily: merged, totalUniqueAllTime, days });
  } catch (error) {
    res.status(500).json({ message: 'Ziyaretci istatistikleri alinamadi', error });
  }
};

// GET /api/admin/stats/active-users — users active in last N hours
export const getActiveUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [activeUsers, totalUsers, onlineNow] = await Promise.all([
      User.countDocuments({ lastActiveAt: { $gte: since } }),
      User.countDocuments(),
      User.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } }), // last 15 min
    ]);

    // Hourly breakdown for chart
    const hourlyActive = await User.aggregate([
      { $match: { lastActiveAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$lastActiveAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: '$_id', count: 1 } },
    ]);

    // Recent active users list (top 10)
    const recentActiveList = await User.find({ lastActiveAt: { $gte: since } })
      .sort({ lastActiveAt: -1 })
      .limit(10)
      .select('name email profileImage lastActiveAt location')
      .lean();

    res.json({
      activeInLast24h: activeUsers,
      onlineNow,
      totalUsers,
      activityRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      hourlyActive,
      recentActiveList,
    });
  } catch (error) {
    res.status(500).json({ message: 'Aktif kullanici istatistikleri alinamadi', error });
  }
};
