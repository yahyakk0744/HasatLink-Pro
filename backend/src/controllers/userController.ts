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
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { checkFieldsForProfanity } from '../utils/profanityFilter';

// Apple's public JWKS for Sign in with Apple identity tokens.
// We verify raw Apple identityToken here (bypassing Firebase) because the
// Firebase Web SDK is unreliable inside WKWebView on iOS 26 and was blocking
// social login on iPad reviewers' devices. Native iOS clients now ship the
// identityToken straight to us and we validate it server-side.
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_AUDIENCE = process.env.APPLE_BUNDLE_ID || 'com.hasatlink.app';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, location, firebaseUid } = req.body || {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'İsim gereklidir' });
      return;
    }
    if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
      res.status(400).json({ message: 'Geçerli bir email adresi giriniz' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const profaneField = checkFieldsForProfanity({ name });
    if (profaneField) {
      ProfanityLog.create({ userId: '', field: profaneField, content: name?.substring(0, 200) || '', endpoint: 'register' }).catch(() => {});
      res.status(400).json({ message: 'Uygunsuz içerik tespit edildi, lütfen düzenleyin' });
      return;
    }
    // Case-insensitive duplicate check so we don't register the same address twice with different casing
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await User.findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } });
    if (existing) {
      res.status(400).json({ message: 'Bu email zaten kayıtlı' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'user_' + Date.now();
    const user = await User.create({ userId, name: name.trim(), email: normalizedEmail, password: hashedPassword, location: location || '', firebaseUid: firebaseUid || '' });
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.status(201).json({ token, user: { userId: user.userId, username: user.username, name: user.name, email: user.email, location: user.location, profileImage: user.profileImage, averageRating: user.averageRating, firebaseUid: user.firebaseUid, role: user.role } });
  } catch (error) {
    console.error('[auth/register] error:', error);
    res.status(500).json({ message: 'Kayıt sırasında sunucu hatası. Lütfen tekrar deneyin.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ message: 'Email veya kullanıcı adı gereklidir' });
      return;
    }
    if (typeof password !== 'string' || !password) {
      res.status(400).json({ message: 'Şifre gereklidir' });
      return;
    }
    const identifier = email.trim();
    // Allow login with email (case-insensitive) or username
    let user;
    if (identifier.includes('@')) {
      // Case-insensitive email lookup: old rows were stored with the casing the user typed.
      const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } });
    } else {
      user = await User.findOne({ username: identifier });
    }
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
    console.error('[auth/login] error:', error);
    res.status(500).json({ message: 'Giriş sırasında sunucu hatası. Lütfen tekrar deneyin.' });
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

// Provider-agnostic Firebase login handler.
// Verifies a Firebase ID token (obtained via any OAuth provider: google, apple, facebook, ...)
// and upserts the user, issuing our own JWT.
export const firebaseLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, appleFallbackName, appleFallbackEmail } = req.body;
    if (!idToken) {
      res.status(400).json({ message: 'Firebase token gerekli' });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, picture } = decoded;
    // Firebase surfaces Apple private-relay or verified emails the same way.
    let { email, name } = decoded as { email?: string; name?: string };

    // Apple only returns the user's name on the FIRST Sign in with Apple.
    // The client forwards it as `appleFallbackName` so we can store it.
    if (!name && appleFallbackName) name = appleFallbackName;
    if (!email && appleFallbackEmail) email = appleFallbackEmail;

    // Map Firebase sign_in_provider -> our authProvider enum
    const signInProvider: string = (decoded as any).firebase?.sign_in_provider || 'password';
    const providerMap: Record<string, string> = {
      'google.com': 'google',
      'apple.com': 'apple',
      'facebook.com': 'facebook',
      'password': 'email',
    };
    const authProvider = providerMap[signInProvider] || 'email';

    if (!email) {
      res.status(400).json({ message: 'Hesapta email bulunamadı' });
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
        authProvider,
        firebaseUid: uid,
        isVerified: true,
      });
    } else {
      let dirty = false;
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        user.authProvider = authProvider;
        dirty = true;
      }
      if (picture && !user.profileImage) {
        user.profileImage = picture;
        dirty = true;
      }
      if (dirty) await user.save();
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
    res.status(401).json({ message: 'Giriş hatası', error });
  }
};

// POST /api/auth/apple
//
// Two accepted payload shapes:
//
// 1) Native iOS client (Capacitor Sign in with Apple plugin):
//    { appleIdentityToken, appleFallbackName?, appleFallbackEmail? }
//    We validate the token against Apple's JWKS directly — NO Firebase.
//    This is what ships with the App Store build because the Firebase Web
//    SDK misbehaves inside WKWebView on iOS 26 and blocked the login flow.
//
// 2) Web client (Firebase OAuth popup/redirect):
//    { idToken, appleFallbackName?, appleFallbackEmail? }
//    We hand the Firebase ID token to firebaseLogin() so web keeps working.
export const appleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appleIdentityToken, idToken, appleFallbackName, appleFallbackEmail } = req.body || {};

    // Native path — verify against Apple JWKS, issue our JWT, skip Firebase entirely
    if (appleIdentityToken) {
      try {
        const { payload } = await jwtVerify(appleIdentityToken, APPLE_JWKS, {
          issuer: APPLE_ISSUER,
          audience: APPLE_AUDIENCE,
        });

        const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
        let email = typeof payload.email === 'string' ? payload.email : undefined;
        if (!email && appleFallbackEmail) email = appleFallbackEmail;

        if (!sub) {
          res.status(400).json({ message: 'Apple hesabı doğrulanamadı' });
          return;
        }

        // Apple may not expose email on repeat sign-ins → fall back to a
        // stable synthetic address keyed on the Apple user identifier so we
        // can still upsert the user deterministically.
        if (!email) email = `${sub}@privaterelay.appleid.hasatlink`;

        const displayName = appleFallbackName || email.split('@')[0];

        // Look up by appleSub first (most reliable), then fall back to email
        let user = await User.findOne({ $or: [{ appleSub: sub }, { email }] });

        if (!user) {
          const userId = 'user_' + Date.now();
          user = await User.create({
            userId,
            name: displayName,
            email,
            appleSub: sub,
            authProvider: 'apple',
            isVerified: true,
          });
        } else {
          let dirty = false;
          if (!user.appleSub) { user.appleSub = sub; dirty = true; }
          if (!user.authProvider || user.authProvider === 'email') { user.authProvider = 'apple'; dirty = true; }
          if (dirty) await user.save();
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
        return;
      } catch (err) {
        console.error('[auth/apple] identityToken verify failed:', err);
        res.status(401).json({ message: 'Apple kimlik doğrulaması başarısız' });
        return;
      }
    }

    // Web path — Firebase ID token
    if (idToken) {
      return firebaseLogin(req, res);
    }

    res.status(400).json({ message: 'Apple kimlik tokeni gerekli' });
  } catch (error) {
    console.error('[auth/apple] error:', error);
    res.status(500).json({ message: 'Apple giriş hatası' });
  }
};

// Google and Facebook still go through Firebase on web.
// Native iOS flows are disabled for these providers in Build 9 because
// the required OAuth client IDs (Google serverClientId, Facebook App ID)
// are not provisioned for this build. Apple Guideline 4.8 is satisfied
// because Sign in with Apple is offered alongside email/password; no
// other third-party logins are present on iOS.
export const googleLogin = firebaseLogin;
export const facebookLogin = firebaseLogin;

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
