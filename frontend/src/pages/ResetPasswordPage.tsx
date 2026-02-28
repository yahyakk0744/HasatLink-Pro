import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import SEO from '../components/ui/SEO';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(isTr ? 'Şifreler eşleşmiyor' : 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error(isTr ? 'Şifre en az 6 karakter olmalı' : 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isTr ? 'Şifre sıfırlama başarısız' : 'Reset failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <SEO title={isTr ? 'Şifre Sıfırla' : 'Reset Password'} />
      <div className="w-full max-w-md">
        <div className="bg-[var(--bg-surface)] rounded-[2.5rem] p-8 shadow-sm">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-[#2D6A4F]" />
              </div>
              <h1 className="text-xl font-semibold">{isTr ? 'Şifre Güncellendi' : 'Password Updated'}</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {isTr ? 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' : 'Your password has been updated. You can now login with your new password.'}
              </p>
              <Button onClick={() => navigate('/giris')} className="w-full" size="lg">
                {isTr ? 'Giriş Yap' : 'Login'}
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-[#2D6A4F]" />
                </div>
                <h1 className="text-xl font-semibold mb-1">{isTr ? 'Yeni Şifre Belirle' : 'Set New Password'}</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isTr ? 'Yeni şifrenizi girin.' : 'Enter your new password.'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={isTr ? 'Yeni Şifre' : 'New Password'}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Input
                  label={isTr ? 'Şifre Tekrar' : 'Confirm Password'}
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  {isTr ? 'Şifremi Güncelle' : 'Update Password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
