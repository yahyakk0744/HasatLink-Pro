import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Settings, Save } from 'lucide-react';
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

export default function AdminSettingsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const [form, setForm] = useState({ instagramUrl: '', twitterUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setForm({ instagramUrl: data.instagramUrl || '', twitterUrl: data.twitterUrl || '' }))
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
        <Settings size={24} className="text-[#2D6A4F]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Site Ayarları' : 'Site Settings'}</h1>
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
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save size={14} className="mr-2" />
          {saving ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Kaydet' : 'Save')}
        </Button>
      </div>
    </div>
  );
}
