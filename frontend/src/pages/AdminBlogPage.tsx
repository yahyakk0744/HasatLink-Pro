import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { Blog } from '../types';
import { formatDate } from '../utils/formatters';

const BLOG_CATEGORIES = ['genel', 'haberler', 'rehber', 'ipuçları', 'teknoloji', 'pazar'];

export default function AdminBlogPage() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('genel');
  const [author, setAuthor] = useState('HasatLink');
  const [published, setPublished] = useState(false);

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  const fetchBlogs = async () => {
    try {
      const { data } = await api.get('/admin/blog');
      setBlogs(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchBlogs(); }, []);

  const resetForm = () => {
    setTitle(''); setContent(''); setCoverImage(''); setCategory('genel'); setAuthor('HasatLink'); setPublished(false);
    setEditing(null); setShowForm(false);
  };

  const openEdit = (blog: Blog) => {
    setTitle(blog.title); setContent(blog.content); setCoverImage(blog.coverImage); setCategory(blog.category); setAuthor(blog.author); setPublished(blog.published);
    setEditing(blog); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { toast.error(lang === 'tr' ? 'Başlık ve içerik zorunlu' : 'Title and content required'); return; }
    try {
      if (editing) {
        await api.put(`/admin/blog/${editing._id}`, { title, content, coverImage, category, author, published });
        toast.success(lang === 'tr' ? 'Yazı güncellendi' : 'Post updated');
      } else {
        await api.post('/admin/blog', { title, content, coverImage, category, author, published });
        toast.success(lang === 'tr' ? 'Yazı oluşturuldu' : 'Post created');
      }
      resetForm();
      fetchBlogs();
    } catch {
      toast.error(lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'tr' ? 'Bu yazıyı silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/admin/blog/${id}`);
      toast.success(lang === 'tr' ? 'Yazı silindi' : 'Post deleted');
      fetchBlogs();
    } catch {
      toast.error(lang === 'tr' ? 'Silme hatası' : 'Delete failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{lang === 'tr' ? 'Blog Yönetimi' : 'Blog Management'}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2D6A4F] text-white text-sm font-semibold rounded-xl hover:bg-[#1B4332] transition-colors"
        >
          <Plus size={16} /> {lang === 'tr' ? 'Yeni Yazı' : 'New Post'}
        </button>
      </div>

      {/* Blog list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : blogs.length === 0 ? (
        <p className="text-center py-12 text-[var(--text-secondary)]">{lang === 'tr' ? 'Henüz yazı yok' : 'No posts yet'}</p>
      ) : (
        <div className="space-y-3">
          {blogs.map(blog => (
            <div key={blog._id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 flex items-center gap-4">
              {blog.coverImage ? (
                <img src={blog.coverImage} alt={blog.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">📝</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{blog.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)] mt-1">
                  <span>{blog.category}</span>
                  <span>{blog.author}</span>
                  <span>{formatDate(blog.createdAt)}</span>
                  <span className={`flex items-center gap-0.5 ${blog.published ? 'text-[#2D6A4F]' : 'text-[#C1341B]'}`}>
                    {blog.published ? <><Eye size={10} /> {lang === 'tr' ? 'Yayında' : 'Published'}</> : <><EyeOff size={10} /> {lang === 'tr' ? 'Taslak' : 'Draft'}</>}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(blog)} className="w-8 h-8 rounded-lg bg-[var(--bg-input)] flex items-center justify-center hover:bg-[#2D6A4F]/10 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(blog._id)} className="w-8 h-8 rounded-lg bg-[var(--bg-input)] flex items-center justify-center hover:bg-[#C1341B]/10 text-[#C1341B] transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative bg-[var(--bg-page)] rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editing ? (lang === 'tr' ? 'Yazıyı Düzenle' : 'Edit Post') : (lang === 'tr' ? 'Yeni Blog Yazısı' : 'New Blog Post')}</h2>
              <button onClick={resetForm} className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">{lang === 'tr' ? 'Başlık' : 'Title'}</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" placeholder={lang === 'tr' ? 'Yazı başlığı...' : 'Post title...'} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">{lang === 'tr' ? 'Kapak Fotoğrafı URL' : 'Cover Image URL'}</label>
                <input value={coverImage} onChange={e => setCoverImage(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">{lang === 'tr' ? 'Kategori' : 'Category'}</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30">
                    {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">{lang === 'tr' ? 'Yazar' : 'Author'}</label>
                  <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">{lang === 'tr' ? 'İçerik (HTML)' : 'Content (HTML)'}</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 font-mono" placeholder={lang === 'tr' ? 'HTML içerik yazın...' : 'Write HTML content...'} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4 rounded border-[var(--border-default)] text-[#2D6A4F] focus:ring-[#2D6A4F]" />
                <span className="text-sm font-medium">{lang === 'tr' ? 'Yayınla' : 'Publish'}</span>
              </label>
              <button onClick={handleSubmit} className="w-full py-3 bg-[#2D6A4F] text-white font-semibold text-sm rounded-xl hover:bg-[#1B4332] transition-colors">
                {editing ? (lang === 'tr' ? 'Güncelle' : 'Update') : (lang === 'tr' ? 'Oluştur' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
