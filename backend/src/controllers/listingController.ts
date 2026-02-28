import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Listing from '../models/Listing';
import User from '../models/User';
import AIDiagnosis from '../models/AIDiagnosis';

export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, type, subCategory, status, listingMode, page = '1', limit = '20' } = req.query;
    const filter: any = {};
    if (type) filter.type = type;
    if (listingMode) filter.listingMode = listingMode;
    if (subCategory) filter.subCategory = subCategory;
    if (status) filter.status = status;
    else filter.status = 'active';
    if (search) {
      const escaped = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [listings, total] = await Promise.all([
      Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit as string)),
      Listing.countDocuments(filter),
    ]);
    res.json({ listings, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    res.status(500).json({ message: 'İlan listesi hatası', error });
  }
};

export const getListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }
    listing.stats.views += 1;
    await listing.save();
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'İlan detay hatası', error });
  }
};

export const createListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.create({ ...req.body, userId: (req as any).userId || req.body.userId });
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: 'İlan oluşturma hatası', error });
  }
};

export const updateListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }
    if ((req as AuthRequest).userId !== listing.userId) {
      res.status(403).json({ message: 'Bu ilanı düzenleme yetkiniz yok' });
      return;
    }
    Object.assign(listing, req.body);
    await listing.save();
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'İlan güncelleme hatası', error });
  }
};

export const deleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }
    if ((req as AuthRequest).userId !== listing.userId) {
      res.status(403).json({ message: 'Bu ilanı silme yetkiniz yok' });
      return;
    }
    await listing.deleteOne();
    res.json({ message: 'İlan silindi' });
  } catch (error) {
    res.status(500).json({ message: 'İlan silme hatası', error });
  }
};

export const waClick = async (req: Request, res: Response): Promise<void> => {
  try {
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { 'stats.whatsappClicks': 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

export const shareListing = async (req: Request, res: Response): Promise<void> => {
  try {
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { 'stats.shares': 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Hata', error });
  }
};

export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [activeListings, registeredUsers, aiDiagnoses, citiesResult] = await Promise.all([
      Listing.countDocuments({ status: 'active' }),
      User.countDocuments(),
      AIDiagnosis.countDocuments(),
      User.distinct('location'),
    ]);
    const cities = new Set(
      citiesResult
        .map((loc: string) => loc?.split(',').pop()?.trim())
        .filter(Boolean)
    );
    res.json({
      activeListings,
      registeredUsers,
      cities: Math.max(cities.size, 1),
      aiDiagnoses,
    });
  } catch (error) {
    res.status(500).json({ message: 'İstatistik hatası', error });
  }
};
