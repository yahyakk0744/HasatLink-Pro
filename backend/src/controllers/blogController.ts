import { Request, Response } from 'express';
import Blog from '../models/Blog';

// Public: list published blogs
export const getBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '12', category } = req.query;
    const filter: any = { published: true };
    if (category) filter.category = category;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [blogs, total] = await Promise.all([
      Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit as string)).lean(),
      Blog.countDocuments(filter),
    ]);
    res.json({ blogs, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    res.status(500).json({ message: 'Blog listesi hatası', error });
  }
};

// Public: get single blog by slug
export const getBlogBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true }).lean();
    if (!blog) { res.status(404).json({ message: 'Yazı bulunamadı' }); return; }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Blog detay hatası', error });
  }
};

// Admin: list all blogs (including unpublished)
export const getAdminBlogs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Blog listesi hatası', error });
  }
};

// Admin: create blog
export const createBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, coverImage, category, author, published } = req.body;
    const slug = title
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const blog = await Blog.create({ title, slug, content, coverImage, category, author, published });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Blog oluşturma hatası', error });
  }
};

// Admin: update blog
export const updateBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) { res.status(404).json({ message: 'Yazı bulunamadı' }); return; }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Blog güncelleme hatası', error });
  }
};

// Admin: delete blog
export const deleteBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Yazı silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Blog silme hatası', error });
  }
};
