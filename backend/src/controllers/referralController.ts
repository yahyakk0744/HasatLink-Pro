import { Request, Response } from 'express';
import crypto from 'crypto';
import Referral from '../models/Referral';
import User from '../models/User';
import SiteSettings from '../models/SiteSettings';
import { awardPoints, POINT_VALUES } from '../utils/pointsService';

// GET /api/referrals/my-code — kullanıcının davet kodu (yoksa oluştur)
export const getMyCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userDoc = await User.findById(user.userId).select('referralCode name').lean();
    if (!userDoc) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    let code = (userDoc as any).referralCode;
    if (!code) {
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
      await User.findByIdAndUpdate(user.userId, { referralCode: code });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://hasatlink.com';
    const link = `${baseUrl}/kayit?ref=${code}`;
    res.json({ code, link });
  } catch (err) {
    res.status(500).json({ message: 'Kod alınamadı' });
  }
};

// GET /api/referrals/my — davet ettiği kişiler
export const getMyReferrals = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const referrals = await Referral.find({ referrerId: user.userId })
      .sort({ createdAt: -1 })
      .lean();
    const totalRewarded = referrals
      .filter(r => r.status === 'rewarded')
      .reduce((sum, r) => sum + (r.rewardPoints || 0), 0);
    res.json({ referrals, totalRewarded, count: referrals.length });
  } catch (err) {
    res.status(500).json({ message: 'Davetler yüklenemedi' });
  }
};

// POST /api/referrals/track — register sırasında çağrılır (referee tarafında)
// Body: { referralCode: string }
export const trackReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { referralCode } = req.body;

    if (!referralCode) {
      res.status(400).json({ message: 'Davet kodu gerekli' });
      return;
    }

    const referrer = await User.findOne({ referralCode }).select('_id').lean();
    if (!referrer) {
      res.status(404).json({ message: 'Geçersiz davet kodu' });
      return;
    }

    // Kendi kendine davet yasak
    if (String(referrer._id) === user.userId) {
      res.status(400).json({ message: 'Kendinize davet gönderemezsiniz' });
      return;
    }

    // Zaten kayıtlı mı
    const existing = await Referral.findOne({ refereeId: user.userId });
    if (existing) {
      res.status(409).json({ message: 'Bu hesap zaten davet ile kayıt oldu' });
      return;
    }

    const settings = await SiteSettings.findOne({ key: 'main' });
    const rewardPoints = settings?.referralProgram?.rewardPoints || POINT_VALUES.REFERRAL_COMPLETED;

    const referral = await Referral.create({
      referrerId: String(referrer._id),
      refereeId: user.userId,
      referralCode,
      status: 'registered',
      rewardPoints,
    });

    // Toggle açıksa puan ver
    if (settings?.referralProgram?.enabled) {
      awardPoints(String(referrer._id), rewardPoints).catch(() => {});
      referral.status = 'rewarded';
      referral.completedAt = new Date();
      await referral.save();
    }

    res.status(201).json({ success: true, referral });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Davet kaydedilemedi' });
  }
};
