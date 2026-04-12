import { Request, Response } from 'express';
import HarvestCalendar from '../models/HarvestCalendar';

// GET /api/harvest-calendar — tüm takvim (cache edilebilir)
export const getCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, category, region } = req.query;
    const query: any = {};
    if (month) query.harvestMonths = Number(month);
    if (category) query.category = category;
    if (region) query.regions = region;

    const items = await HarvestCalendar.find(query).lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Takvim yüklenemedi' });
  }
};

// GET /api/harvest-calendar/:product
export const getProductCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await HarvestCalendar.findOne({ product: req.params.product }).lean();
    if (!item) {
      res.status(404).json({ message: 'Ürün bulunamadı' });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Ürün yüklenemedi' });
  }
};

// POST /api/admin/harvest-calendar
export const createHarvest = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await HarvestCalendar.create(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'Oluşturulamadı' });
  }
};

// PUT /api/admin/harvest-calendar/:id
export const updateHarvest = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await HarvestCalendar.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!item) {
      res.status(404).json({ message: 'Bulunamadı' });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Güncellenemedi' });
  }
};

// DELETE /api/admin/harvest-calendar/:id
export const deleteHarvest = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await HarvestCalendar.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404).json({ message: 'Bulunamadı' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Silinemedi' });
  }
};
