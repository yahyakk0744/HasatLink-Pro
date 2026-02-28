import { Request, Response } from 'express';
import User from '../models/User';
import Listing from '../models/Listing';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import admin from '../config/firebase';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, location, firebaseUid } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Bu email zaten kayıtlı' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'user_' + Date.now();
    const user = await User.create({ userId, name, email, password: hashedPassword, location: location || '', firebaseUid: firebaseUid || '' });
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.status(201).json({ token, user: { userId: user.userId, name: user.name, email: user.email, location: user.location, profileImage: user.profileImage, averageRating: user.averageRating, firebaseUid: user.firebaseUid } });
  } catch (error) {
    res.status(500).json({ message: 'Kayıt hatası', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Email veya şifre hatalı' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Email veya şifre hatalı' });
      return;
    }
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.json({ token, user: { userId: user.userId, name: user.name, email: user.email, location: user.location, profileImage: user.profileImage, averageRating: user.averageRating, firebaseUid: user.firebaseUid } });
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
        name: user.name,
        email: user.email,
        location: user.location,
        profileImage: user.profileImage,
        averageRating: user.averageRating,
        firebaseUid: user.firebaseUid,
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
