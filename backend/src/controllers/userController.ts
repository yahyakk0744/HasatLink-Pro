import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Listing from '../models/Listing';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
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
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.json({ token, user: { userId: user.userId, username: user.username, name: user.name, email: user.email, location: user.location, profileImage: user.profileImage, averageRating: user.averageRating, firebaseUid: user.firebaseUid, role: user.role } });
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

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists
      res.json({ message: 'Şifre sıfırlama bağlantısı gönderildi' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/sifre-sifirla/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"HasatLink" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'HasatLink - Şifre Sıfırlama',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#2D6A4F">HasatLink Şifre Sıfırlama</h2>
          <p>Merhaba <strong>${user.name}</strong>,</p>
          <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2D6A4F;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0">Şifremi Sıfırla</a>
          <p style="color:#666;font-size:13px">Bu bağlantı 1 saat geçerlidir. Eğer şifre sıfırlama talebinde bulunmadıysanız bu emaili görmezden gelin.</p>
        </div>
      `,
    });

    res.json({ message: 'Şifre sıfırlama bağlantısı gönderildi' });
  } catch (error) {
    res.status(500).json({ message: 'Şifre sıfırlama hatası', error });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      res.status(400).json({ message: 'Geçersiz veya süresi dolmuş bağlantı' });
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Şifreniz başarıyla güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Şifre güncelleme hatası', error });
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
