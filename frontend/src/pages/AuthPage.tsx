import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SEO from '../components/ui/SEO';
import { API_ORIGIN } from '../config/api';

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { login, register, loginWithGoogle, loginWithApple, loginWithFacebook } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const progressTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Facebook App ID must be configured in Meta Developer Console + capacitor.config
  // before the button can work. Env flag lets us hide it until credentials are wired up.
  const facebookEnabled = import.meta.env.VITE_ENABLE_FACEBOOK_LOGIN === 'true';

  // Pre-warm the backend when the auth screen mounts. Render free-tier can
  // take 30-60s to wake from sleep and Apple reviewers consistently saw the
  // login fail because they tapped before the first real request landed.
  useEffect(() => {
    const base = API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`;
    fetch(`${base}/ping`, { method: 'GET', cache: 'no-store' }).catch(() => {});
  }, []);

  const clearProgressTimers = () => {
    progressTimers.current.forEach(clearTimeout);
    progressTimers.current = [];
    setProgressMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Progressive feedback so reviewers/users never see a silent spinner
    // while Render wakes up. Clears on finish.
    progressTimers.current.push(setTimeout(() => {
      setProgressMsg(isTr ? 'Sunucuya bağlanılıyor…' : 'Connecting to server…');
    }, 2500));
    progressTimers.current.push(setTimeout(() => {
      setProgressMsg(isTr ? 'Sunucu uyandırılıyor, lütfen bekleyin…' : 'Waking up server, please wait…');
    }, 8000));
    progressTimers.current.push(setTimeout(() => {
      setProgressMsg(isTr ? 'Neredeyse tamam, biraz daha…' : 'Almost there, one moment…');
    }, 20000));

    const result = isLogin
      ? await login(email, password)
      : await register(name, email, password, location);
    clearProgressTimers();
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

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    const result = await loginWithApple();
    setAppleLoading(false);
    if (result.success) {
      toast.success(t('success'));
      navigate('/');
    } else if (result.message) {
      toast.error(result.message);
    }
  };

  const handleFacebookLogin = async () => {
    setFacebookLoading(true);
    const result = await loginWithFacebook();
    setFacebookLoading(false);
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
            <span className="text-[var(--accent-green)]">LiNK</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{t('appSlogan')}</p>
        </div>

        <div className="surface-card-lg p-8">
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

          {/* Social Login Buttons */}
          <div className="space-y-2.5">
            {/* Apple Sign In — required by App Store when any social login is present */}
            <button
              onClick={handleAppleLogin}
              disabled={appleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black text-white rounded-2xl text-sm font-semibold hover:bg-gray-900 transition-all disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              {appleLoading ? t('loading') : (isTr ? 'Apple ile Giriş Yap' : 'Sign in with Apple')}
            </button>

            {/* Google Sign In */}
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

            {/* Facebook Sign In — hidden until VITE_ENABLE_FACEBOOK_LOGIN=true and FB App ID configured */}
            {facebookEnabled && (
              <button
                onClick={handleFacebookLogin}
                disabled={facebookLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#1877F2] text-white rounded-2xl text-sm font-semibold hover:bg-[#166fe5] transition-all disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {facebookLoading ? t('loading') : (isTr ? 'Facebook ile Giriş Yap' : 'Sign in with Facebook')}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
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
            {loading && progressMsg && (
              <p className="text-center text-xs text-[var(--text-secondary)] mt-2 animate-pulse" role="status" aria-live="polite">
                {progressMsg}
              </p>
            )}
          </form>

          <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
            {isLogin ? t('noAccount') : t('hasAccount')}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-[var(--accent-green)] font-semibold">
              {isLogin ? t('registerTitle') : t('loginTitle')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
