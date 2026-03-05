import { Request, Response } from 'express';
import Offer from '../models/Offer';
import Listing from '../models/Listing';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';
import { sendSocketNotification } from '../socket';
import { awardPoints, POINT_VALUES } from '../utils/pointsService';

export const createOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const fromUserId = (req as any).userId;
    const { listingId, offerPrice, message } = req.body;

    if (!listingId || !offerPrice || offerPrice <= 0) {
      res.status(400).json({ message: 'Geçersiz teklif' });
      return;
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      res.status(404).json({ message: 'İlan bulunamadı' });
      return;
    }

    if (!listing.is_negotiable) {
      res.status(400).json({ message: 'Bu ilan pazarlığa kapalı' });
      return;
    }

    if (listing.userId === fromUserId) {
      res.status(400).json({ message: 'Kendi ilanınıza teklif veremezsiniz' });
      return;
    }

    const fromUser = await User.findOne({ userId: fromUserId });

    const offer = await Offer.create({
      listingId,
      listingTitle: listing.title,
      fromUserId,
      fromUserName: fromUser?.name || '',
      toUserId: listing.userId,
      offerPrice,
      message: message || '',
    });

    // Send notification to listing owner
    const priceFormatted = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(offerPrice);
    const notif = await Notification.create({
      userId: listing.userId,
      type: 'ilan',
      title: 'Yeni Teklif!',
      message: `${fromUser?.name || 'Bir kullanıcı'} "${listing.title}" için ${priceFormatted} teklif verdi`,
      relatedId: listing._id.toString(),
    });

    sendSocketNotification(listing.userId, {
      ...notif.toObject(),
      playSound: true,
    });

    sendPushToUser(listing.userId, {
      title: 'Yeni Teklif!',
      body: `${fromUser?.name || 'Bir kullanıcı'} "${listing.title}" için ${priceFormatted} teklif verdi`,
      url: `/ilan/${listing._id}`,
    }, notif);

    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: 'Teklif oluşturma hatası', error });
  }
};

export const getOffersForListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const offers = await Offer.find({ listingId: req.params.listingId }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Teklifler alınamadı', error });
  }
};

export const getMyOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const offers = await Offer.find({ $or: [{ fromUserId: userId }, { toUserId: userId }] }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Teklifler alınamadı', error });
  }
};

export const updateOfferStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { status } = req.body;
    const offer = await Offer.findById(req.params.id);
    if (!offer) { res.status(404).json({ message: 'Teklif bulunamadı' }); return; }
    if (offer.toUserId !== userId) { res.status(403).json({ message: 'Yetki yok' }); return; }
    offer.status = status;
    await offer.save();

    // Notify the offer sender
    const statusText = status === 'accepted' ? 'kabul edildi' : 'reddedildi';
    const toUser = await User.findOne({ userId: offer.toUserId }).select('name').lean();
    const notif = await Notification.create({
      userId: offer.fromUserId,
      type: 'teklif',
      title: `Teklif ${status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}`,
      message: `"${offer.listingTitle}" için teklifiniz ${statusText}`,
      relatedId: offer.listingId,
    });
    sendSocketNotification(offer.fromUserId, { ...notif.toObject(), playSound: true });

    // Send push to buyer
    sendPushToUser(offer.fromUserId, {
      title: notif.title,
      body: notif.message,
      url: `/ilan/${offer.listingId}`,
    }, notif);

    // If accepted, award points and build receipt data
    if (status === 'accepted') {
      awardPoints(offer.fromUserId, POINT_VALUES.ACCEPTED_OFFER);
      awardPoints(offer.toUserId, POINT_VALUES.ACCEPTED_OFFER);
      const receipt = {
        listingTitle: offer.listingTitle,
        listingId: offer.listingId,
        offerPrice: offer.offerPrice,
        buyerName: offer.fromUserName,
        sellerName: toUser?.name || '',
        date: new Date().toISOString(),
      };
      // Notify seller too
      const sellerNotif = await Notification.create({
        userId: offer.toUserId,
        type: 'teklif',
        title: 'Islem Onaylandi',
        message: `"${offer.listingTitle}" - ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(offer.offerPrice)}`,
        relatedId: offer.listingId,
      });
      sendSocketNotification(offer.toUserId, { ...sellerNotif.toObject(), receipt, playSound: true });
      sendSocketNotification(offer.fromUserId, { ...notif.toObject(), receipt, playSound: true });
    }

    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: 'Teklif güncelleme hatası', error });
  }
};
