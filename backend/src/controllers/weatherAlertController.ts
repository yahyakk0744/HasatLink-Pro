import { Request, Response } from 'express';
import WeatherAlert from '../models/WeatherAlert';
import User from '../models/User';

// GET /api/weather-alerts/my — kullanıcının uyarıları
export const getMyAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const now = new Date();
    const alerts = await WeatherAlert.find({
      userId: user.userId,
      validUntil: { $gte: now },
    })
      .sort({ severity: -1, createdAt: -1 })
      .lean();
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Uyarılar yüklenemedi' });
  }
};

// POST /api/weather-alerts/:id/read
export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const alert = await WeatherAlert.findOneAndUpdate(
      { _id: req.params.id, userId: user.userId },
      { isRead: true },
      { new: true }
    );
    if (!alert) {
      res.status(404).json({ message: 'Bulunamadı' });
      return;
    }
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Güncellenemedi' });
  }
};

// POST /api/admin/weather-alerts/broadcast — admin tüm şehir kullanıcılarına uyarı gönderir
// Body: { city, alertType, severity, message, validFrom, validUntil }
export const broadcastAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, alertType, severity, message, validFrom, validUntil } = req.body;
    if (!city || !alertType || !message) {
      res.status(400).json({ message: 'city, alertType, message gerekli' });
      return;
    }

    // İlgili şehirdeki kullanıcılar
    const users = await User.find({
      location: { $regex: city, $options: 'i' },
    })
      .select('userId location')
      .lean();

    const alerts = users.map(u => ({
      userId: u.userId,
      city,
      district: '',
      alertType,
      severity: severity || 'medium',
      message,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000),
    }));

    if (alerts.length > 0) {
      await WeatherAlert.insertMany(alerts);
    }

    res.json({ success: true, sentTo: alerts.length });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Uyarı gönderilemedi' });
  }
};
