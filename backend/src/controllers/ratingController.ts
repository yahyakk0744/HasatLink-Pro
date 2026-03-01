import { Request, Response } from 'express';
import Rating from '../models/Rating';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

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

    // Fetch fromUser info for denormalization
    const fromUser = await User.findOne({ userId: fromUserId });
    const rating = await Rating.create({
      fromUserId, toUserId, listingId, score, comment,
      fromUserName: fromUser?.name || '',
      fromUserImage: fromUser?.profileImage || '',
    });

    // Update user average rating
    const allRatings = await Rating.find({ toUserId });
    const avgScore = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
    await User.findOneAndUpdate(
      { userId: toUserId },
      { averageRating: Math.round(avgScore * 10) / 10, totalRatings: allRatings.length }
    );
    const notif = await Notification.create({
      userId: toUserId,
      type: 'rating',
      title: 'Yeni Değerlendirme',
      message: `${fromUser?.name || 'Bir kullanıcı'} size ${score} yıldız verdi`,
      relatedId: rating._id?.toString() || '',
    });

    // Send real-time + push notification
    sendPushToUser(toUserId, {
      title: 'Yeni Değerlendirme',
      body: `${fromUser?.name || 'Bir kullanıcı'} size ${score} yıldız verdi`,
      url: '/profil',
    }, notif);

    res.status(201).json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Yorum oluşturma hatası', error });
  }
};
