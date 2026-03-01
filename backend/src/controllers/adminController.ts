import { Request, Response } from 'express';
import User from '../models/User';
import Listing from '../models/Listing';
import ContactMessage from '../models/ContactMessage';
import MarketPrice from '../models/MarketPrice';
import Ad from '../models/Ad';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

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
    ] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      Ad.countDocuments(),
      Ad.countDocuments({ enabled: true }),
      User.countDocuments({ isBanned: true }),
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
    if (!['active', 'sold', 'rented', 'closed'].includes(status)) {
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

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
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
    user.isVerified = !user.isVerified;
    await user.save();
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
    const { title, message, type, userIds } = req.body;
    if (!title || !message) {
      res.status(400).json({ message: 'Başlık ve mesaj zorunludur' });
      return;
    }

    const notifType = type || 'sistem';

    // If userIds provided, send to specific users; otherwise send to all
    let targetUsers: { userId: string }[];
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUsers = userIds.map((id: string) => ({ userId: id }));
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
