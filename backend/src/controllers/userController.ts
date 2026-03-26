import { Request, Response } from 'express';
import User from '../models/User';
import Listing from '../models/Listing';
import Offer from '../models/Offer';
import Rating from '../models/Rating';
import Comment from '../models/Comment';
import Notification from '../models/Notification';
import Report from '../models/Report';
import PriceAlert from '../models/PriceAlert';
import AIDiagnosis from '../models/AIDiagnosis';
import ListingShare from '../models/ListingShare';
import PushSubscription from '../models/PushSubscription';
import ProfanityLog from '../models/ProfanityLog';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import admin from '../config/firebase';
import { checkFieldsForProfanity } from '../utils/profanityFilter';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, location, firebaseUid } = req.body;
    const profaneField = checkFieldsForProfanity({ name });
    if (profaneField) {
      ProfanityLog.create({ userId: '', field: profaneField, content: name?.substring(0, 200) || '', endpoint: 'register' }).catch(() => {});
      res.status(400).json({ message: 'Uygunsuz içerik tespit edildi, lütfen düzenleyin' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Bu email zaten kayıtlı' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'user_' + Date.now();
    const user = await User.create({ userId, name, email, password: hashedPassword, location: location || '', firebaseUid: firebaseUid || '' });
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.status(201).json({ token, user: { userId: user.userId, username: user.username, name: user.name, email: user.email, location: user.location, profileImage: user.profileImage, averageRating: user.averageRating, firebaseUid: user.firebaseUid, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Kayıt hatası', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    // Allow login with email or username
    const user = await User.findOne(
      email.includes('@') ? { email } : { username: email }
    );
    if (!user) {
      res.status(400).json({ message: 'Email veya şifre hatalı' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Email veya şifre hatalı' });
      return;
    }

    // If account has pending deletion, notify but still allow login
    let deletionWarning: string | undefined;
    if (user.deletionScheduledAt) {
      const daysLeft = Math.ceil((new Date(user.deletionScheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      deletionWarning = `Hesabiniz ${daysLeft} gun sonra silinecek. Iptal etmek icin hesap ayarlarinizi kontrol edin.`;
    }

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.json({ token, deletionWarning, user: { userId: user.userId, username: user.username, name: user.name, email: user.email, location: user.location, profileImage: user.profileImage, averageRating: user.averageRating, firebaseUid: user.firebaseUid, role: user.role, deletionScheduledAt: user.deletionScheduledAt } });
  } catch (error) {
    res.status(500).json({ message: 'Giriş hatası', error });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await User.findOne({ userId }).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = (req as any).userId;
    if (authUserId !== req.params.userId) {
      res.status(403).json({ message: 'Bu profili düzenleme yetkiniz yok' });
      return;
    }
    const allowedFields = ['name', 'location', 'profileImage', 'bio', 'phone'];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const profaneField = checkFieldsForProfanity({ name: updates.name, bio: updates.bio });
    if (profaneField) {
      ProfanityLog.create({ userId: authUserId, field: profaneField, content: updates[profaneField]?.substring(0, 200) || '', endpoint: 'updateUser' }).catch(() => {});
      res.status(400).json({ message: 'Uygunsuz içerik tespit edildi, lütfen düzenleyin' });
      return;
    }
    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: updates },
      { new: true }
    ).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Güncelleme hatası', error });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ message: 'Firebase token gerekli' });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    if (!email) {
      res.status(400).json({ message: 'Google hesabında email bulunamadı' });
      return;
    }

    let user = await User.findOne({ email });

    if (!user) {
      const userId = 'user_' + Date.now();
      user = await User.create({
        userId,
        name: name || email.split('@')[0],
        email,
        profileImage: picture || '',
        authProvider: 'google',
        firebaseUid: uid,
        isVerified: true,
      });
    } else {
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        user.authProvider = 'google';
        if (picture && !user.profileImage) user.profileImage = picture;
        await user.save();
      }
    }

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        email: user.email,
        location: user.location,
        profileImage: user.profileImage,
        averageRating: user.averageRating,
        firebaseUid: user.firebaseUid,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({ message: 'Google giriş hatası', error });
  }
};

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const listings = await Listing.find({ userId: req.params.userId });
    const totalViews = listings.reduce((sum, l) => sum + (l.stats?.views || 0), 0);
    const totalWhatsapp = listings.reduce((sum, l) => sum + (l.stats?.whatsappClicks || 0), 0);
    const totalShares = listings.reduce((sum, l) => sum + (l.stats?.shares || 0), 0);
    res.json({
      totalListings: listings.length,
      activeListings: listings.filter(l => l.status === 'active').length,
      totalViews,
      totalWhatsapp,
      totalShares,
    });
  } catch (error) {
    res.status(500).json({ message: 'İstatistik hatası', error });
  }
};

// PUT /api/auth/account — update username, email, password (auth required)
export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await User.findOne({ userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    const { username, email, currentPassword, newPassword } = req.body;

    // Username change
    if (username !== undefined && username !== user.username) {
      if (username) {
        const existing = await User.findOne({ username, userId: { $ne: userId } });
        if (existing) {
          res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
          return;
        }
      }
      user.username = username;
    }

    // Email change
    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({ email, userId: { $ne: userId } });
      if (existing) {
        res.status(400).json({ message: 'Bu email zaten kullanılıyor' });
        return;
      }
      user.email = email;
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ message: 'Mevcut şifrenizi girmelisiniz' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ message: 'Mevcut şifre hatalı' });
        return;
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({ message: 'Hesap bilgileri güncellendi', user: { userId: user.userId, username: user.username, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Hesap güncelleme hatası', error });
  }
};

// ─── Recalculate Trust Score ───
export const recalculateTrustScore = async (userId: string): Promise<void> => {
  try {
    const user = await User.findOne({ userId });
    if (!user) return;

    const listingCount = await Listing.countDocuments({ userId, status: 'active' });
    const averageRating = user.averageRating || 0;
    const totalRatings = user.totalRatings || 0;

    const trust_score = Math.min(
      100,
      Math.round(
        (averageRating / 5) * 40 +
        Math.min(listingCount, 20) * 2 +
        Math.min(totalRatings, 50) * 0.4
      )
    );

    const updates: any = { trust_score };

    // Auto-verify elite producers
    if (averageRating >= 4.5 && listingCount >= 10) {
      updates.isVerified = true;
    }

    await User.findOneAndUpdate({ userId }, { $set: updates });
  } catch (error) {
    console.error('Trust score hesaplama hatası:', error);
  }
};

// ─── Toggle Favorite ───
interface ToggleFavoriteBody {
  listingId: string;
}

interface ToggleFavoriteResponse {
  favorites: string[];
  isFavorited: boolean;
}

export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const { listingId } = req.body as ToggleFavoriteBody;

    if (!listingId || typeof listingId !== 'string') {
      res.status(400).json({ message: 'listingId gerekli' });
      return;
    }

    const user = await User.findOne({ userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanici bulunamadi' });
      return;
    }

    const index = user.favorites.indexOf(listingId);
    const isFavorited = index === -1;
    if (isFavorited) {
      user.favorites.push(listingId);
    } else {
      user.favorites.splice(index, 1);
    }
    await user.save();

    // Emit socket event to the user
    const { getIO } = require('../socket');
    try {
      getIO().to(`user:${userId}`).emit('favorite:toggle', {
        listingId,
        isFavorited,
        totalFavorites: user.favorites.length,
      });

      // Notify listing owner ONLY if it's NOT the user's own listing (self-notification filter)
      if (isFavorited) {
        const listing = await Listing.findById(listingId).select('userId');
        if (listing && listing.userId !== userId) {
          getIO().to(`user:${listing.userId}`).emit('notification:favorite', {
            listingId,
            userName: user.name,
            type: 'new_favorite',
          });
        }
      }
    } catch {}

    const response: ToggleFavoriteResponse = { favorites: user.favorites, isFavorited };
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Favori guncellenemedi', error });
  }
};

// ─── Get Favorites ───
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await User.findOne({ userId }).select('favorites');
    res.json({ favorites: user?.favorites || [] });
  } catch (error) {
    res.status(500).json({ message: 'Favoriler alinamadi', error });
  }
};

// ─── Request Account Deletion (30-day grace period) ───
export const requestAccountDeletion = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { password, reason } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanici bulunamadi' });
      return;
    }

    // Admin accounts cannot self-delete
    if (user.role === 'admin') {
      res.status(403).json({ message: 'Admin hesabi silinemez' });
      return;
    }

    // Verify password (skip for Google-only accounts)
    if (user.authProvider === 'email') {
      if (!password) {
        res.status(400).json({ message: 'Sifrenizi girmelisiniz' });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ message: 'Sifre hatali' });
        return;
      }
    }

    // Schedule deletion 30 days from now
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    user.deletionScheduledAt = deletionDate;
    user.deletionReason = reason || '';
    user.isSuspended = true;
    await user.save();

    res.json({
      message: 'Hesabiniz 30 gun sonra silinecek. Bu sure icinde giris yaparak iptal edebilirsiniz.',
      deletionScheduledAt: deletionDate.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Hesap silme istegi basarisiz', error });
  }
};

// ─── Cancel Account Deletion ───
export const cancelAccountDeletion = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await User.findOne({ userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanici bulunamadi' });
      return;
    }

    if (!user.deletionScheduledAt) {
      res.status(400).json({ message: 'Aktif silme istegi yok' });
      return;
    }

    user.deletionScheduledAt = null;
    user.deletionReason = '';
    user.isSuspended = false;
    await user.save();

    res.json({ message: 'Hesap silme istegi iptal edildi' });
  } catch (error) {
    res.status(500).json({ message: 'Iptal islemi basarisiz', error });
  }
};

// ─── Purge All User Data (called by cron after 30 days) ───
export const purgeUserData = async (userId: string): Promise<{ deletedCounts: Record<string, number> }> => {
  const counts: Record<string, number> = {};

  // Get user's listing IDs (as strings) for cascading deletes
  const userListings = await Listing.find({ userId }).select('_id');
  const listingIdStrings = userListings.map(l => String(l._id));

  // Delete all user-related data across every model
  const [
    listings, offers, ratingsFrom, ratingsTo,
    comments, notifications, reports,
    priceAlerts, aiDiagnoses, shares,
    pushSubs, profanityLogs,
  ] = await Promise.all([
    Listing.deleteMany({ userId }),
    Offer.deleteMany({ $or: [{ fromUserId: userId }, { toUserId: userId }] }),
    Rating.deleteMany({ fromUserId: userId }),
    Rating.deleteMany({ toUserId: userId }),
    Comment.deleteMany({ $or: [{ userId }, ...(listingIdStrings.length > 0 ? [{ listingId: { $in: listingIdStrings } }] : [])] }),
    Notification.deleteMany({ userId }),
    Report.deleteMany({ reporterUserId: userId }),
    PriceAlert.deleteMany({ userId }),
    AIDiagnosis.deleteMany({ userId }),
    ListingShare.deleteMany({ userId }),
    PushSubscription.deleteMany({ userId }),
    ProfanityLog.deleteMany({ userId }),
  ]);

  counts.listings = listings.deletedCount;
  counts.offers = offers.deletedCount;
  counts.ratings = ratingsFrom.deletedCount + ratingsTo.deletedCount;
  counts.comments = comments.deletedCount;
  counts.notifications = notifications.deletedCount;
  counts.reports = reports.deletedCount;
  counts.priceAlerts = priceAlerts.deletedCount;
  counts.aiDiagnoses = aiDiagnoses.deletedCount;
  counts.shares = shares.deletedCount;
  counts.pushSubscriptions = pushSubs.deletedCount;
  counts.profanityLogs = profanityLogs.deletedCount;

  // Delete Firebase Auth account
  const user = await User.findOne({ userId });
  if (user?.firebaseUid) {
    try {
      await admin.auth().deleteUser(user.firebaseUid);
    } catch {}
  }

  // Finally delete the user document
  await User.deleteOne({ userId });
  counts.user = 1;

  return { deletedCounts: counts };
};

// ─── Cron: Process Expired Deletion Requests ───
export const processExpiredDeletions = async (): Promise<number> => {
  const now = new Date();
  const expiredUsers = await User.find({
    deletionScheduledAt: { $ne: null, $lte: now },
  }).select('userId');

  let count = 0;
  for (const user of expiredUsers) {
    try {
      await purgeUserData(user.userId);
      count++;
      console.log(`[CRON] Kullanici silindi: ${user.userId}`);
    } catch (err) {
      console.error(`[CRON] Kullanici silme hatasi: ${user.userId}`, err);
    }
  }
  return count;
};
