import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import IOSInstallGuide from './IOSInstallGuide';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'hasatlink_pwa_dismissed';

function detectPlatform(): 'android' | 'ios' | 'other' {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'other';
}

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === 'forever' || standalone) return;

    const detected = detectPlatform();
    setPlatform(detected);

    const isMobile = detected === 'android' || detected === 'ios';
    if (!isMobile) return;

    // Android: show APK download immediately
    if (detected === 'android') {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }

    // iOS: show install guide
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (detected === 'ios') {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', handler); };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (platform === 'android') {
      // Direct APK download
      const link = document.createElement('a');
      link.href = '/downloads/HasatLink.apk';
      link.download = 'HasatLink.apk';
      link.click();
      setShow(false);
      return;
    }
    if (platform === 'ios') {
      setShow(false);
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'forever');
    setShow(false);
  };

  if (!show || isStandalone) return <IOSInstallGuide isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />;

  const isAndroid = platform === 'android';
  const isIOS = platform === 'ios';

  return (
    <>
      {/* Slim bottom banner — max 80px */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-[var(--bg-surface)] border-t border-[var(--border-default)] shadow-lg px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <img src="/icons/icon.svg" alt="HasatLink" className="w-9 h-9 rounded-xl shrink-0" />
            <p className="flex-1 text-xs font-medium text-[var(--text-primary)] truncate">
              {isAndroid ? 'Android uygulamayı indir' : isIOS ? 'Ana ekrana ekle' : 'HasatLink uygulamasını yükle'}
            </p>
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 bg-[#2D6A4F] text-white text-xs font-bold rounded-lg hover:bg-[#1B4332] transition-colors shrink-0"
            >
              {isAndroid ? (
                <><Download size={12} className="inline mr-1 -mt-0.5" />İndir</>
              ) : isIOS ? (
                <><Share size={12} className="inline mr-1 -mt-0.5" />Ekle</>
              ) : (
                <><Download size={12} className="inline mr-1 -mt-0.5" />Yükle</>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      <IOSInstallGuide isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  );
}
