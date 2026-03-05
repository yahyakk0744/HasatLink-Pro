import { Request, Response } from 'express';
import Dealer from '../models/Dealer';
import { haversineDistance } from '../utils/haversine';

// ─── PUBLIC: Get nearby approved dealers with contextual matching ───
export const getNearbyDealers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, radius = 50, disease_code, region, limit = 20, page = 1 } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ message: 'lat ve lng parametreleri zorunlu' });
      return;
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const maxRadius = parseFloat(radius as string);
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const now = new Date();

    // Only approved dealers: is_premium_partner=true OR ad_status='active'
    // AND is_active=true AND within date range
    const filter: any = {
      $or: [
        { is_premium_partner: true },
        { ad_status: 'active' },
      ],
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now },
    };

    // Region-based targeting
    if (region) {
      const regionStr = (region as string).toLowerCase();
      filter.$and = [
        {
          $or: [
            { target_regions: { $size: 0 } }, // No region restriction = show everywhere
            { target_regions: { $elemMatch: { $regex: new RegExp(regionStr, 'i') } } },
          ],
        },
      ];
    }

    const dealers = await Dealer.find(filter).select('-__v');

    // Filter by haversine distance and calculate distance for each
    let nearby = dealers
      .map(dealer => {
        const distance = haversineDistance(
          userLat, userLng,
          dealer.coordinates.lat, dealer.coordinates.lng
        );
        return { dealer: dealer.toObject(), distance: Math.round(distance * 10) / 10 };
      })
      .filter(item => item.distance <= maxRadius);

    // Contextual matching: boost dealers whose specialization_tags match disease_code
    if (disease_code) {
      const code = (disease_code as string).toLowerCase();
      nearby = nearby.map(item => {
        const tags = item.dealer.specialization_tags.map((t: string) => t.toLowerCase());
        const matchScore = tags.some((tag: string) =>
          code.includes(tag) || tag.includes(code)
        ) ? 1 : 0;
        return { ...item, matchScore };
      });

      // Sort: matched first (by matchScore desc), then by distance asc
      nearby.sort((a: any, b: any) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return a.distance - b.distance;
      });
    } else {
      // Sort by distance only
      nearby.sort((a, b) => a.distance - b.distance);
    }

    // Pagination
    const total = nearby.length;
    const start = (pageNum - 1) * limitNum;
    const paged = nearby.slice(start, start + limitNum);

    // Track impressions for returned dealers
    const dealerIds = paged.map(item => item.dealer._id);
    if (dealerIds.length > 0) {
      await Dealer.updateMany(
        { _id: { $in: dealerIds } },
        { $inc: { impressionCount: 1 } }
      );
    }

    res.json({
      dealers: paged,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ message: 'Bayiler alınamadı', error });
  }
};

// ─── PUBLIC: Track dealer click ───
export const trackDealerClick = async (req: Request, res: Response): Promise<void> => {
  try {
    await Dealer.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Tıklama kaydedilemedi', error });
  }
};

// ─── PUBLIC: Track dealer contact (WhatsApp/Maps) ───
export const trackDealerContact = async (req: Request, res: Response): Promise<void> => {
  try {
    await Dealer.findByIdAndUpdate(req.params.id, { $inc: { contactCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'İletişim kaydedilemedi', error });
  }
};

// ─── ADMIN: Get all dealers ───
export const getAllDealers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const dealers = await Dealer.find().sort({ createdAt: -1 });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: 'Bayiler alınamadı', error });
  }
};

// ─── ADMIN: Create dealer ───
export const createDealer = async (req: Request, res: Response): Promise<void> => {
  try {
    const dealer = await Dealer.create(req.body);
    res.status(201).json(dealer);
  } catch (error) {
    res.status(500).json({ message: 'Bayi oluşturulamadı', error });
  }
};

// ─── ADMIN: Update dealer ───
export const updateDealer = async (req: Request, res: Response): Promise<void> => {
  try {
    const dealer = await Dealer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dealer) { res.status(404).json({ message: 'Bayi bulunamadı' }); return; }
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ message: 'Bayi güncellenemedi', error });
  }
};

// ─── ADMIN: Delete dealer ───
export const deleteDealer = async (req: Request, res: Response): Promise<void> => {
  try {
    const dealer = await Dealer.findByIdAndDelete(req.params.id);
    if (!dealer) { res.status(404).json({ message: 'Bayi bulunamadı' }); return; }
    res.json({ message: 'Bayi silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Bayi silinemedi', error });
  }
};

// ─── ADMIN: Toggle dealer active status ───
export const toggleDealerActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) { res.status(404).json({ message: 'Bayi bulunamadı' }); return; }
    dealer.is_active = !dealer.is_active;
    await dealer.save();
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ message: 'Durum değiştirilemedi', error });
  }
};

// ─── CRON: Auto-expire dealers whose end_date has passed ───
export const expireOutdatedDealers = async (): Promise<number> => {
  const result = await Dealer.updateMany(
    {
      end_date: { $lt: new Date() },
      is_active: true,
    },
    {
      $set: { is_active: false, ad_status: 'expired' },
    }
  );
  return result.modifiedCount;
};
