import { Request, Response } from 'express';
import PriceAlert from '../models/PriceAlert';

export const createAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { category, subCategory, targetPrice, keyword, condition } = req.body;
    if (!category || !targetPrice) {
      res.status(400).json({ message: 'Kategori ve hedef fiyat gerekli' });
      return;
    }
    const normalizedCondition = condition === 'above' ? 'above' : 'below';
    const alert = await PriceAlert.create({
      userId,
      category,
      subCategory: subCategory || '',
      targetPrice,
      keyword: keyword || '',
      condition: normalizedCondition,
    });
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Alarm oluşturma hatası', error });
  }
};

export const getMyAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const alerts = await PriceAlert.find({ userId }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Alarm listesi hatası', error });
  }
};

export const deleteAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const alert = await PriceAlert.findById(req.params.id);
    if (!alert) { res.status(404).json({ message: 'Alarm bulunamadı' }); return; }
    if (alert.userId !== userId) { res.status(403).json({ message: 'Yetki yok' }); return; }
    await alert.deleteOne();
    res.json({ message: 'Alarm silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Alarm silme hatası', error });
  }
};

export const toggleAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const alert = await PriceAlert.findById(req.params.id);
    if (!alert) { res.status(404).json({ message: 'Alarm bulunamadı' }); return; }
    if (alert.userId !== userId) { res.status(403).json({ message: 'Yetki yok' }); return; }
    alert.isActive = !alert.isActive;
    await alert.save();
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Alarm güncelleme hatası', error });
  }
};
