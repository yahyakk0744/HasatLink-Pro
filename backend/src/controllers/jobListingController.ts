import { Request, Response } from 'express';
import JobListing from '../models/JobListing';
import User from '../models/User';

// GET /api/jobs — list
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, category, workType, search, page = 1, limit = 20 } = req.query;
    const query: any = { status: 'active' };
    if (city) query['location.city'] = city;
    if (category) query.category = category;
    if (workType) query.workType = workType;
    if (search) query.$or = [
      { title: { $regex: String(search), $options: 'i' } },
      { description: { $regex: String(search), $options: 'i' } },
    ];

    const p = Math.max(1, Number(page) || 1);
    const lim = Math.min(50, Math.max(5, Number(limit) || 20));
    const skip = (p - 1) * lim;

    const [jobs, total] = await Promise.all([
      JobListing.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      JobListing.countDocuments(query),
    ]);

    res.json({ jobs, total, page: p, limit: lim });
  } catch (err) {
    res.status(500).json({ message: 'İş ilanları yüklenemedi' });
  }
};

// GET /api/jobs/:id
export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await JobListing.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();
    if (!job) {
      res.status(404).json({ message: 'İş ilanı bulunamadı' });
      return;
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'İş ilanı yüklenemedi' });
  }
};

// POST /api/jobs
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userDoc = await User.findById(user.userId).select('name phone').lean();

    const job = await JobListing.create({
      ...req.body,
      userId: user.userId,
      userName: userDoc?.name || 'Kullanıcı',
      userPhone: userDoc?.phone || '',
      userWhatsapp: userDoc?.phone || '',
    });
    res.status(201).json(job);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'İş ilanı oluşturulamadı' });
  }
};

// PUT /api/jobs/:id
export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const job = await JobListing.findById(req.params.id);
    if (!job) {
      res.status(404).json({ message: 'Bulunamadı' });
      return;
    }
    if (job.userId !== user.userId && user.role !== 'admin') {
      res.status(403).json({ message: 'Yetkisiz' });
      return;
    }
    Object.assign(job, req.body, { updatedAt: new Date() });
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Güncellenemedi' });
  }
};

// DELETE /api/jobs/:id
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const job = await JobListing.findById(req.params.id);
    if (!job) {
      res.status(404).json({ message: 'Bulunamadı' });
      return;
    }
    if (job.userId !== user.userId && user.role !== 'admin') {
      res.status(403).json({ message: 'Yetkisiz' });
      return;
    }
    await job.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Silinemedi' });
  }
};

// GET /api/jobs/my — kullanıcının kendi ilanları
export const getMyJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const jobs = await JobListing.find({ userId: user.userId }).sort({ createdAt: -1 }).lean();
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'İş ilanları yüklenemedi' });
  }
};
