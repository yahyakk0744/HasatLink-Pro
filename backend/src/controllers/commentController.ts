import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Comment from '../models/Comment';
import User from '../models/User';

export const getListingComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({ listingId: req.params.listingId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Yorumlar yüklenirken hata oluştu', error });
  }
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { listingId, text, parentId } = req.body;

    if (parentId) {
      const parent = await Comment.findById(parentId);
      if (!parent) {
        res.status(404).json({ message: 'Yanıtlanacak yorum bulunamadı' });
        return;
      }
    }

    const user = await User.findOne({ userId });
    const comment = await Comment.create({
      listingId,
      userId,
      userName: user?.name || '',
      userImage: user?.profileImage || '',
      text,
      parentId: parentId || null,
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Yorum oluşturma hatası', error });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404).json({ message: 'Yorum bulunamadı' });
      return;
    }
    if ((req as AuthRequest).userId !== comment.userId) {
      res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok' });
      return;
    }
    await comment.deleteOne();
    // Also delete replies to this comment
    await Comment.deleteMany({ parentId: comment._id });
    res.json({ message: 'Yorum silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Yorum silme hatası', error });
  }
};
