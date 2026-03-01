import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Settings, Save, DollarSign, Megaphone, UserCog, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-[#E4405F]">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-[#0A66C2]">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-[#FF0000]">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function AdminSettingsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ siteTitle: '', siteDescription: '', logoUrl: '', instagramUrl: '', twitterUrl: '', linkedinUrl: '', youtubeUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setForm({
        siteTitle: data.siteTitle || '',
        siteDescription: data.siteDescription || '',
        logoUrl: data.logoUrl || '',
        instagramUrl: data.instagramUrl || '',
        twitterUrl: data.twitterUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        youtubeUrl: data.youtubeUrl || '',
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      toast.success(isTr ? 'Ayarlar kaydedildi' : 'Settings saved');
    } catch {
      toast.error(isTr ? 'Kaydetme başarısız' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Admin - Ayarlar' : 'Admin - Settings'} />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--bg-input)] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <Settings size={24} className="text-[#2D6A4F]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Site Ayarları' : 'Site Settings'}</h1>
      </div>

      {/* Site Info */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {isTr ? 'Site Bilgileri' : 'Site Information'}
        </h2>
        <div className="space-y-4">
          <Input
            label={isTr ? 'Site Başlığı' : 'Site Title'}
            value={form.siteTitle}
            onChange={e => setForm(f => ({ ...f, siteTitle: e.target.value }))}
            placeholder="HasatLink"
          />
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{isTr ? 'Site Açıklaması' : 'Site Description'}</label>
            <textarea
              value={form.siteDescription}
              onChange={e => setForm(f => ({ ...f, siteDescription: e.target.value }))}
              placeholder={isTr ? 'HasatLink - Tarım Pazarı' : 'HasatLink - Agriculture Marketplace'}
              rows={3}
              className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-2xl text-sm outline-none focus:border-[#2D6A4F] transition-colors resize-none"
            />
          </div>
          <Input
            label={isTr ? 'Logo URL' : 'Logo URL'}
            value={form.logoUrl}
            onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://example.com/logo.png"
          />
          {form.logoUrl && (
            <div className="flex items-center gap-3 p-3 bg-[var(--bg-input)] rounded-xl">
              <img src={form.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg" onError={e => (e.currentTarget.style.display = 'none')} />
              <span className="text-xs text-[var(--text-secondary)]">{isTr ? 'Logo önizleme' : 'Logo preview'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {isTr ? 'Sosyal Medya Linkleri' : 'Social Media Links'}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0">
              <InstagramIcon />
            </div>
            <div className="flex-1">
              <Input
                label="Instagram URL"
                value={form.instagramUrl}
                onChange={e => setForm(f => ({ ...f, instagramUrl: e.target.value }))}
                placeholder="https://instagram.com/hasatlink"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0">
              <XIcon />
            </div>
            <div className="flex-1">
              <Input
                label="X (Twitter) URL"
                value={form.twitterUrl}
                onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))}
                placeholder="https://x.com/hasatlink"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0">
              <LinkedInIcon />
            </div>
            <div className="flex-1">
              <Input
                label="LinkedIn URL"
                value={form.linkedinUrl}
                onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/company/hasatlink"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center shrink-0">
              <YouTubeIcon />
            </div>
            <div className="flex-1">
              <Input
                label="YouTube URL"
                value={form.youtubeUrl}
                onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))}
                placeholder="https://youtube.com/@hasatlink"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save size={14} className="mr-2" />
          {saving ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Kaydet' : 'Save')}
        </Button>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <button
          onClick={() => navigate('/hesap-ayarlari')}
          className="flex items-center gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm hover:shadow-md transition-all text-left group sm:col-span-2"
        >
          <div className="w-12 h-12 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">
            <UserCog size={22} className="text-[#2D6A4F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{isTr ? 'Hesap Ayarları' : 'Account Settings'}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{isTr ? 'Kullanıcı adı, email, şifre değiştir' : 'Username, email, password change'}</p>
          </div>
          <ChevronRight size={18} className="text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <button
          onClick={() => navigate('/admin/gelir')}
          className="flex items-center gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">
            <DollarSign size={22} className="text-[#2D6A4F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{isTr ? 'Gelir Yönetimi' : 'Revenue Management'}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{isTr ? 'Öne çıkan ilan, premium, komisyon' : 'Featured listing, premium, commission'}</p>
          </div>
          <ChevronRight size={18} className="text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/admin/reklamlar')}
          className="flex items-center gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">
            <Megaphone size={22} className="text-[#2D6A4F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{isTr ? 'Reklam Yönetimi' : 'Ad Management'}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{isTr ? 'Banner reklamlar, istatistikler' : 'Banner ads, statistics'}</p>
          </div>
          <ChevronRight size={18} className="text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
