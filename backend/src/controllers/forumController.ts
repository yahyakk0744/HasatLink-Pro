import { Request, Response } from 'express';
import Question from '../models/Question';
import Answer from '../models/Answer';
import User from '../models/User';
import { awardPoints, POINT_VALUES } from '../utils/pointsService';

// GET /api/forum/questions — listele (filtre + pagination)
export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      search,
      resolved,
      sort = 'recent',
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = {};
    if (category && category !== 'all') query.category = category;
    if (resolved === 'true') query.isResolved = true;
    if (resolved === 'false') query.isResolved = false;
    if (search) query.$text = { $search: String(search) };

    let sortBy: any = { createdAt: -1 };
    if (sort === 'popular') sortBy = { upvotes: -1, createdAt: -1 };
    if (sort === 'unanswered') {
      query.answerCount = 0;
      sortBy = { createdAt: -1 };
    }

    const p = Math.max(1, Number(page) || 1);
    const lim = Math.min(50, Math.max(5, Number(limit) || 20));
    const skip = (p - 1) * lim;

    const [questions, total] = await Promise.all([
      Question.find(query).sort(sortBy).skip(skip).limit(lim).lean(),
      Question.countDocuments(query),
    ]);

    res.json({ questions, total, page: p, limit: lim });
  } catch (err) {
    console.error('getQuestions error:', err);
    res.status(500).json({ message: 'Sorular yüklenemedi' });
  }
};

// GET /api/forum/questions/:id — detay + view count++
export const getQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();

    if (!question) {
      res.status(404).json({ message: 'Soru bulunamadı' });
      return;
    }

    const answers = await Answer.find({ questionId: req.params.id })
      .sort({ isBestAnswer: -1, upvotes: -1, createdAt: 1 })
      .lean();

    res.json({ question, answers });
  } catch (err) {
    console.error('getQuestion error:', err);
    res.status(500).json({ message: 'Soru yüklenemedi' });
  }
};

// POST /api/forum/questions — yeni soru
export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { title, body, category, tags, images } = req.body;

    if (!title?.trim() || !body?.trim()) {
      res.status(400).json({ message: 'Başlık ve içerik gerekli' });
      return;
    }

    const userDoc = await User.findById(user.userId).select('name profileImage').lean();

    const question = await Question.create({
      userId: user.userId,
      userName: userDoc?.name || 'Kullanıcı',
      userAvatar: userDoc?.profileImage || '',
      title: title.trim(),
      body: body.trim(),
      category: category || 'genel',
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      images: Array.isArray(images) ? images.slice(0, 5) : [],
    });

    // Puan ver
    awardPoints(user.userId, POINT_VALUES.QUESTION_ASKED).catch(() => {});

    res.status(201).json(question);
  } catch (err: any) {
    console.error('createQuestion error:', err);
    res.status(500).json({ message: err?.message || 'Soru oluşturulamadı' });
  }
};

// POST /api/forum/questions/:id/upvote
export const upvoteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const question = await Question.findById(req.params.id);
    if (!question) {
      res.status(404).json({ message: 'Soru bulunamadı' });
      return;
    }

    const idx = question.upvotes.indexOf(user.userId);
    if (idx >= 0) {
      question.upvotes.splice(idx, 1);
    } else {
      question.upvotes.push(user.userId);
    }
    await question.save();
    res.json({ upvoted: idx < 0, count: question.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: 'Oy verilemedi' });
  }
};

// DELETE /api/forum/questions/:id (owner or admin)
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const question = await Question.findById(req.params.id);
    if (!question) {
      res.status(404).json({ message: 'Soru bulunamadı' });
      return;
    }
    if (question.userId !== user.userId && user.role !== 'admin') {
      res.status(403).json({ message: 'Yetkisiz' });
      return;
    }
    await Answer.deleteMany({ questionId: req.params.id });
    await question.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Silinemedi' });
  }
};

// POST /api/forum/questions/:id/answers — cevap ekle
export const createAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { body, images } = req.body;

    if (!body?.trim()) {
      res.status(400).json({ message: 'Cevap boş olamaz' });
      return;
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      res.status(404).json({ message: 'Soru bulunamadı' });
      return;
    }

    const userDoc = await User.findById(user.userId).select('name profileImage role isVerified').lean();

    const answer = await Answer.create({
      questionId: String(req.params.id),
      userId: user.userId,
      userName: userDoc?.name || 'Kullanıcı',
      userAvatar: userDoc?.profileImage || '',
      isExpert: userDoc?.isVerified || false, // Doğrulanmış hesap = uzman
      body: body.trim(),
      images: Array.isArray(images) ? images.slice(0, 3) : [],
    });

    question.answerCount = (question.answerCount || 0) + 1;
    await question.save();

    awardPoints(user.userId, POINT_VALUES.ANSWER_GIVEN).catch(() => {});

    res.status(201).json(answer);
  } catch (err: any) {
    console.error('createAnswer error:', err);
    res.status(500).json({ message: err?.message || 'Cevap eklenemedi' });
  }
};

// POST /api/forum/answers/:id/upvote
export const upvoteAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      res.status(404).json({ message: 'Cevap bulunamadı' });
      return;
    }
    const idx = answer.upvotes.indexOf(user.userId);
    if (idx >= 0) {
      answer.upvotes.splice(idx, 1);
    } else {
      answer.upvotes.push(user.userId);
    }
    await answer.save();
    res.json({ upvoted: idx < 0, count: answer.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: 'Oy verilemedi' });
  }
};

// POST /api/forum/questions/:questionId/best-answer/:answerId — en iyi cevap seç
export const markBestAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { questionId, answerId } = req.params;
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ message: 'Soru bulunamadı' });
      return;
    }
    if (question.userId !== user.userId) {
      res.status(403).json({ message: 'Sadece soru sahibi seçebilir' });
      return;
    }
    // Önceki best answer'ı temizle
    if (question.bestAnswerId) {
      await Answer.findByIdAndUpdate(question.bestAnswerId, { isBestAnswer: false });
    }
    const newBest = await Answer.findByIdAndUpdate(
      answerId,
      { isBestAnswer: true },
      { new: true }
    );
    if (!newBest) {
      res.status(404).json({ message: 'Cevap bulunamadı' });
      return;
    }
    question.bestAnswerId = String(answerId);
    question.isResolved = true;
    await question.save();

    // Cevap sahibine bonus puan
    awardPoints(newBest.userId, POINT_VALUES.BEST_ANSWER).catch(() => {});

    res.json({ success: true, question, answer: newBest });
  } catch (err) {
    res.status(500).json({ message: 'İşlem başarısız' });
  }
};

// DELETE /api/forum/answers/:id
export const deleteAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      res.status(404).json({ message: 'Cevap bulunamadı' });
      return;
    }
    if (answer.userId !== user.userId && user.role !== 'admin') {
      res.status(403).json({ message: 'Yetkisiz' });
      return;
    }
    await answer.deleteOne();
    await Question.findByIdAndUpdate(answer.questionId, { $inc: { answerCount: -1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Silinemedi' });
  }
};
