import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SEO from '../components/ui/SEO';

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = isLogin
      ? await login(email, password)
      : await register(name, email, password, location);
    setLoading(false);

    if (result.success) {
      toast.success(t('success'));
      navigate('/');
    } else {
      toast.error(result.message || t('error'));
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result.success) {
      toast.success(t('success'));
      navigate('/');
    } else if (result.message) {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <SEO
        title={isTr ? 'Giriş Yap' : 'Login'}
        description={isTr ? 'HasatLink hesabınıza giriş yapın veya yeni hesap oluşturun.' : 'Login to your HasatLink account or create a new one.'}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            <span className="text-[var(--text-primary)]">HASAT</span>
            <span className="text-[#2D6A4F]">LiNK</span>
          </h1>
          <p className="text-sm text-[#6B6560]">{t('appSlogan')}</p>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-[2.5rem] p-8 shadow-sm">
          {/* Tab Switch */}
          <div className="flex bg-[var(--bg-input)] rounded-full p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-all ${
                isLogin ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {t('loginTitle')}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-all ${
                !isLogin ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {t('registerTitle')}
            </button>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {googleLoading ? t('loading') : t('googleLogin')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[var(--border-default)]"></div>
            <span className="text-xs text-[var(--text-secondary)] font-medium">{t('orDivider')}</span>
            <div className="flex-1 h-px bg-[var(--border-default)]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input label={t('name')} value={name} onChange={e => setName(e.target.value)} required />
            )}
            <Input label={isLogin ? (isTr ? 'Email veya Kullanıcı Adı' : 'Email or Username') : t('email')} type={isLogin ? 'text' : 'email'} value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label={t('password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            {!isLogin && (
              <Input label={t('location')} value={location} onChange={e => setLocation(e.target.value)} />
            )}
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {isLogin ? t('loginTitle') : t('registerTitle')}
            </Button>
          </form>

          {isLogin && (
            <p className="text-center mt-3">
              <button type="button" onClick={() => navigate('/sifremi-unuttum')} className="text-xs text-[#2D6A4F] font-semibold hover:underline">
                {isTr ? 'Şifremi Unuttum' : 'Forgot Password'}
              </button>
            </p>
          )}

          <p className="text-center text-xs text-[#6B6560] mt-4">
            {isLogin ? t('noAccount') : t('hasAccount')}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-[#2D6A4F] font-semibold">
              {isLogin ? t('registerTitle') : t('loginTitle')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
