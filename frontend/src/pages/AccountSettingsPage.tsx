import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { UserCog, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function AccountSettingsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/auth/me')
      .then(({ data }) => {
        setUsername(data.username || '');
        setEmail(data.email || '');
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
        <UserCog size={24} className="text-[#2D6A4F]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Hesap Ayarları' : 'Account Settings'}</h1>
      </div>

      <div className="space-y-6">
        {/* Username & Email */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-4">
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
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-4">
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
      </div>
    </div>
  );
}
