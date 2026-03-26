import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { UserCog, Save, Trash2, AlertTriangle, ShieldX, Undo2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function AccountSettingsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user, updateUserData, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/auth/me')
      .then(({ data }) => {
        setUsername(data.username || '');
        setEmail(data.email || '');
        setDeletionScheduledAt(data.deletionScheduledAt || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error(isTr ? 'Yeni şifreler eşleşmiyor' : 'New passwords do not match');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error(isTr ? 'Şifre en az 6 karakter olmalı' : 'Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = { username, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const { data } = await api.put('/auth/account', payload);
      updateUserData({ username: data.user.username, email: data.user.email });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(isTr ? 'Hesap bilgileri güncellendi' : 'Account updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isTr ? 'Güncelleme başarısız' : 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <Navigate to="/giris" replace />;
  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Hesap Ayarları' : 'Account Settings'} />

      <div className="flex items-center gap-3 mb-6">
        <UserCog size={24} className="text-[var(--accent-green)]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Hesap Ayarları' : 'Account Settings'}</h1>
      </div>

      <div className="space-y-6">
        {/* Username & Email */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {isTr ? 'Hesap Bilgileri' : 'Account Info'}
          </h2>
          <Input
            label={isTr ? 'Kullanıcı Adı' : 'Username'}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="kullanici_adi"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        {/* Password Change */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {isTr ? 'Şifre Değiştir' : 'Change Password'}
          </h2>
          <Input
            label={isTr ? 'Mevcut Şifre' : 'Current Password'}
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />
          <Input
            label={isTr ? 'Yeni Şifre' : 'New Password'}
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            minLength={6}
          />
          <Input
            label={isTr ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password'}
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            minLength={6}
          />
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full">
          <Save size={14} className="mr-2" />
          {isTr ? 'Kaydet' : 'Save'}
        </Button>

        {/* ─── Account Deletion Section ─── */}
        <div className="surface-card rounded-2xl p-6 space-y-4 border-2 border-red-200/50">
          <div className="flex items-center gap-2">
            <ShieldX size={18} className="text-red-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600">
              {isTr ? 'Hesabi Sil' : 'Delete Account'}
            </h2>
          </div>

          {deletionScheduledAt ? (
            // Deletion is scheduled — show warning + cancel button
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-amber-800">
                    {isTr ? 'Hesabiniz silinmek uzere' : 'Your account is scheduled for deletion'}
                  </p>
                  <p className="text-[12px] text-amber-700 mt-1">
                    {isTr
                      ? `Tum verileriniz ${new Date(deletionScheduledAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde kalici olarak silinecek.`
                      : `All your data will be permanently deleted on ${new Date(deletionScheduledAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  setCancelling(true);
                  try {
                    await api.post('/auth/cancel-deletion');
                    setDeletionScheduledAt(null);
                    toast.success(isTr ? 'Silme istegi iptal edildi' : 'Deletion cancelled');
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || (isTr ? 'Iptal basarisiz' : 'Cancel failed'));
                  } finally {
                    setCancelling(false);
                  }
                }}
                disabled={cancelling}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Undo2 size={16} />
                {cancelling
                  ? (isTr ? 'Iptal ediliyor...' : 'Cancelling...')
                  : (isTr ? 'Silme Istegini Iptal Et' : 'Cancel Deletion Request')}
              </button>
            </div>
          ) : (
            // No deletion scheduled — show delete button
            <div className="space-y-3">
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                {isTr
                  ? 'Hesabinizi sildiginizde 30 gun boyunca giris yaparak isleimi iptal edebilirsiniz. 30 gun sonra tum verileriniz (ilanlar, mesajlar, yorumlar, puanlar, bildirimler) kalici olarak silinir ve geri alinamaz.'
                  : 'After requesting deletion, you have 30 days to cancel by logging in. After 30 days, all your data (listings, messages, comments, ratings, notifications) will be permanently deleted and cannot be recovered.'}
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                {isTr ? 'Hesabimi Sil' : 'Delete My Account'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteReason(''); }}>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[var(--text-primary)]">
                {isTr ? 'Hesabinizi silmek istediginize emin misiniz?' : 'Are you sure you want to delete your account?'}
              </h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                {isTr ? 'Bu islem 30 gun sonra geri alinamaz' : 'This action cannot be undone after 30 days'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1.5">
            <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
              {isTr ? 'Silinecek veriler:' : 'Data that will be deleted:'}
            </p>
            <ul className="text-[12px] text-red-600 space-y-0.5">
              {[
                isTr ? 'Tum ilanlariniz' : 'All your listings',
                isTr ? 'Mesajlariniz' : 'Your messages',
                isTr ? 'Yorumlariniz ve puanlariniz' : 'Your comments and ratings',
                isTr ? 'Bildirimleriniz' : 'Your notifications',
                isTr ? 'AI teshis gecmisiniz' : 'Your AI diagnosis history',
                isTr ? 'Favorileriniz ve ayarlariniz' : 'Your favorites and settings',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Input
              label={isTr ? 'Sifrenizi girin' : 'Enter your password'}
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder={isTr ? 'Onay icin sifreniz' : 'Password for confirmation'}
            />
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
                {isTr ? 'Neden ayriliyorsunuz? (opsiyonel)' : 'Why are you leaving? (optional)'}
              </label>
              <select
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">{isTr ? 'Secim yapin...' : 'Select...'}</option>
                <option value="not-useful">{isTr ? 'Isime yaramadi' : 'Not useful for me'}</option>
                <option value="privacy">{isTr ? 'Gizlilik endisesi' : 'Privacy concerns'}</option>
                <option value="too-many-notifications">{isTr ? 'Cok fazla bildirim' : 'Too many notifications'}</option>
                <option value="found-alternative">{isTr ? 'Baska bir platform buldum' : 'Found an alternative'}</option>
                <option value="temporary">{isTr ? 'Gecici olarak ayriliyorum' : 'Leaving temporarily'}</option>
                <option value="other">{isTr ? 'Diger' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteReason(''); }}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-[13px] hover:bg-gray-200 transition-colors"
            >
              {isTr ? 'Vazgec' : 'Cancel'}
            </button>
            <button
              onClick={async () => {
                if (!deletePassword && user?.authProvider !== 'google') {
                  toast.error(isTr ? 'Sifrenizi girin' : 'Enter your password');
                  return;
                }
                setDeleting(true);
                try {
                  const { data } = await api.delete('/auth/account', { data: { password: deletePassword, reason: deleteReason } });
                  setDeletionScheduledAt(data.deletionScheduledAt);
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteReason('');
                  toast.success(isTr ? 'Hesap silme istegi alindi. 30 gun sonra silinecek.' : 'Account deletion scheduled. Will be deleted in 30 days.');
                  // Log out after a short delay
                  setTimeout(() => logout(), 2000);
                } catch (err: any) {
                  toast.error(err.response?.data?.message || (isTr ? 'Islem basarisiz' : 'Operation failed'));
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting || (!deletePassword && user?.authProvider !== 'google')}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting
                ? (isTr ? 'Isleniyor...' : 'Processing...')
                : (isTr ? 'Evet, Hesabimi Sil' : 'Yes, Delete My Account')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
