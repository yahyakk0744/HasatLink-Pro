import { Request, Response } from 'express';
import ContactMessage from '../models/ContactMessage';
import Notification from '../models/Notification';
import User from '../models/User';

// POST /api/contact — public
export const createContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      res.status(400).json({ message: 'Tüm alanlar zorunludur' });
      return;
    }
    const contact = await ContactMessage.create({ name, email, subject, message });

    // Notify all admins
    try {
      const admins = await User.find({ role: 'admin' }).select('userId');
      const { sendSocketNotification } = require('../socket');
      for (const admin of admins) {
        const notif = await Notification.create({
          userId: admin.userId,
          type: 'sistem',
          title: `Yeni Destek Mesajı: ${subject}`,
          message: `${name} - ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
          relatedId: contact._id?.toString(),
        });
        try { sendSocketNotification(admin.userId, notif); } catch {}
      }
    } catch {}

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Mesaj gönderilemedi', error });
  }
};

// GET /api/admin/contacts — admin only
export const getContactMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Mesajlar alınamadı', error });
  }
};

// PATCH /api/admin/contacts/:id/read — admin only
export const markContactAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!message) {
      res.status(404).json({ message: 'Mesaj bulunamadı' });
      return;
    }
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Güncelleme başarısız', error });
  }
};

// DELETE /api/admin/contacts/:id — admin only
export const deleteContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      res.status(404).json({ message: 'Mesaj bulunamadı' });
      return;
    }
    res.json({ message: 'Mesaj silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Silme başarısız', error });
  }
};
