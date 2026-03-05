import { Request, Response } from 'express';
import Rating from '../models/Rating';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';
import { recalculateTrustScore } from './userController';
import { sendSocketNotification } from '../socket';

export const getUserRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const ratings = await Rating.find({ toUserId: req.params.userId }).sort({ createdAt: -1 });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Yorum hatası', error });
  }
};

export const createRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromUserId, toUserId, listingId, score, comment } = req.body;

    const fromUser = await User.findOne({ userId: fromUserId });
    const existing = await Rating.findOne({ fromUserId, toUserId });

    let updated = false;
    let rating;

    if (existing) {
      existing.score = score;
      existing.comment = comment || '';
      existing.listingId = listingId || '';
      await existing.save();
      rating = existing;
      updated = true;
    } else {
      rating = await Rating.create({
        fromUserId, toUserId, listingId, score, comment,
        fromUserName: fromUser?.name || '',
        fromUserImage: fromUser?.profileImage || '',
      });

      const notif = await Notification.create({
        userId: toUserId,
        type: 'rating',
        title: 'Yeni Değerlendirme',
        message: `${fromUser?.name || 'Bir kullanıcı'} size ${score} yıldız verdi`,
        relatedId: rating._id?.toString() || '',
      });

      sendPushToUser(toUserId, {
        title: 'Yeni Değerlendirme',
        body: `${fromUser?.name || 'Bir kullanıcı'} size ${score} yıldız verdi`,
        url: '/profil',
      }, notif);
    }

    // Recalculate average rating
    const allRatings = await Rating.find({ toUserId });
    const avgScore = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
    await User.findOneAndUpdate(
      { userId: toUserId },
      { averageRating: Math.round(avgScore * 10) / 10, totalRatings: allRatings.length }
    );

    // Recalculate trust score for the rated user
    await recalculateTrustScore(toUserId);

    res.status(updated ? 200 : 201).json({ ...rating.toObject(), updated });
  } catch (error) {
    res.status(500).json({ message: 'Yorum oluşturma hatası', error });
  }
};

export const deleteRatingComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const rating = await Rating.findById(req.params.id);
    if (!rating) { res.status(404).json({ message: 'Yorum bulunamadı' }); return; }
    if (rating.fromUserId !== userId) { res.status(403).json({ message: 'Yetki yok' }); return; }
    rating.comment = '';
    rating.commentDeleted = true;
    await rating.save();
    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Yorum silme hatası', error });
  }
};

export const updateRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { score, comment } = req.body;
    const rating = await Rating.findById(req.params.id);
    if (!rating) { res.status(404).json({ message: 'Değerlendirme bulunamadı' }); return; }
    if (rating.fromUserId !== userId) { res.status(403).json({ message: 'Yetki yok' }); return; }
    if (score) rating.score = score;
    if (comment !== undefined) rating.comment = comment;
    rating.isUpdated = true;
    rating.commentDeleted = false;
    await rating.save();
    // Recalculate average
    const allRatings = await Rating.find({ toUserId: rating.toUserId });
    const avgScore = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
    await User.findOneAndUpdate(
      { userId: rating.toUserId },
      { averageRating: Math.round(avgScore * 10) / 10, totalRatings: allRatings.length }
    );
    await recalculateTrustScore(rating.toUserId);
    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Güncelleme hatası', error });
  }
};

export const addSellerReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { reply } = req.body;
    const rating = await Rating.findById(req.params.id);
    if (!rating) { res.status(404).json({ message: 'Değerlendirme bulunamadı' }); return; }
    if (rating.toUserId !== userId) { res.status(403).json({ message: 'Sadece satıcı yanıt verebilir' }); return; }
    rating.seller_reply = reply || '';
    await rating.save();
    // Notify buyer
    try {
      const seller = await User.findOne({ userId });
      const notif = await Notification.create({
        userId: rating.fromUserId,
        type: 'rating',
        title: 'Satıcı Yanıtı',
        message: `${seller?.name || 'Satıcı'} değerlendirmenize yanıt verdi`,
        relatedId: rating._id?.toString() || '',
      });
      sendSocketNotification(rating.fromUserId, { ...notif.toObject(), playSound: true });
    } catch {}
    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Yanıt hatası', error });
  }
};

export const deleteSellerReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const rating = await Rating.findById(req.params.id);
    if (!rating) { res.status(404).json({ message: 'Değerlendirme bulunamadı' }); return; }
    if (rating.toUserId !== userId) { res.status(403).json({ message: 'Yetki yok' }); return; }
    rating.seller_reply = '';
    await rating.save();
    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Yanıt silme hatası', error });
  }
};

export const adminHardDeleteRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) { res.status(404).json({ message: 'Değerlendirme bulunamadı' }); return; }
    const toUserId = rating.toUserId;
    await rating.deleteOne();
    // Recalculate average
    const allRatings = await Rating.find({ toUserId });
    if (allRatings.length > 0) {
      const avgScore = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
      await User.findOneAndUpdate({ userId: toUserId }, { averageRating: Math.round(avgScore * 10) / 10, totalRatings: allRatings.length });
    } else {
      await User.findOneAndUpdate({ userId: toUserId }, { averageRating: 0, totalRatings: 0 });
    }
    await recalculateTrustScore(toUserId);
    res.json({ message: 'Değerlendirme tamamen silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Silme hatası', error });
  }
};
