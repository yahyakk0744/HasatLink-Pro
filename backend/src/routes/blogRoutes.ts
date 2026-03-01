import { Router } from 'express';
import auth from '../middleware/auth';
import admin from '../middleware/admin';
import { getBlogs, getBlogBySlug, getAdminBlogs, createBlog, updateBlog, deleteBlog } from '../controllers/blogController';

const router = Router();

// Public
router.get('/blog', getBlogs);
router.get('/blog/:slug', getBlogBySlug);

// Admin
router.get('/admin/blog', auth, admin, getAdminBlogs);
router.post('/admin/blog', auth, admin, createBlog);
router.put('/admin/blog/:id', auth, admin, updateBlog);
router.delete('/admin/blog/:id', auth, admin, deleteBlog);

export default router;
