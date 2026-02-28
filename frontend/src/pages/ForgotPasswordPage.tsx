import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import SEO from '../components/ui/SEO';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import api from '../config/api';

export default function ForgotPasswordPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setSent(true); // Don't reveal if email exists
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <SEO title={isTr ? 'Şifremi Unuttum' : 'Forgot Password'} />
      <div className="w-full max-w-md">
        <div className="bg-[var(--bg-surface)] rounded-[2.5rem] p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-[#2D6A4F]" />
              </div>
              <h1 className="text-xl font-semibold">{isTr ? 'Email Gönderildi' : 'Email Sent'}</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {isTr
                  ? 'Eğer bu email adresiyle kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.'
                  : 'If an account exists with this email, a password reset link has been sent. Please check your inbox.'}
              </p>
              <Link to="/giris" className="inline-flex items-center gap-2 text-sm text-[#2D6A4F] font-semibold hover:underline mt-4">
                <ArrowLeft size={16} />
                {isTr ? 'Giriş sayfasına dön' : 'Back to login'}
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-[#2D6A4F]" />
                </div>
                <h1 className="text-xl font-semibold mb-1">{isTr ? 'Şifremi Unuttum' : 'Forgot Password'}</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isTr ? 'Kayıtlı email adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.' : 'Enter your registered email to receive a password reset link.'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="ornek@email.com"
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  {isTr ? 'Sıfırlama Bağlantısı Gönder' : 'Send Reset Link'}
                </Button>
              </form>
              <p className="text-center mt-4">
                <Link to="/giris" className="text-xs text-[#2D6A4F] font-semibold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={14} />
                  {isTr ? 'Giriş sayfasına dön' : 'Back to login'}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
