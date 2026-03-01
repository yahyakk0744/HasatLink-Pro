import { useState, useEffect } from 'react';
import { Download, Smartphone, Zap, Bell, Wifi } from 'lucide-react';
import IOSInstallGuide from '../ui/IOSInstallGuide';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function MobileAppDownload() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  // Hide on desktop or if already installed
  if (isStandalone) return null;

  return (
    <>
      {/* Mobile only — hidden on md+ */}
      <section className="md:hidden mb-20 mx-4 mt-8">
        <div className="bg-gradient-to-br from-[#2D6A4F] via-[#1B4332] to-[#0F2B1E] rounded-3xl p-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/[0.03] rounded-full" />

          {/* App icon + Title */}
          <div className="flex items-center gap-4 mb-5 relative">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-lg flex-shrink-0">
              <img src="/icons/icon.svg" alt="HasatLink" className="w-14 h-14 rounded-xl" />
            </div>
            <div>
              <h3 className="text-white text-lg font-bold tracking-tight">
                HasatLink Uygulamasını İndir
              </h3>
              <p className="text-white/60 text-xs mt-0.5">
                Tarım pazarının dijital gücü cebinde
              </p>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-6 relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
              <Zap size={12} className="text-yellow-300" />
              <span className="text-[10px] text-white/80 font-medium">Hızlı Erişim</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
              <Bell size={12} className="text-orange-300" />
              <span className="text-[10px] text-white/80 font-medium">Anlık Bildirim</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
              <Wifi size={12} className="text-blue-300" />
              <span className="text-[10px] text-white/80 font-medium">Offline Kullanım</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
              <Smartphone size={12} className="text-green-300" />
              <span className="text-[10px] text-white/80 font-medium">Uygulama Deneyimi</span>
            </div>
          </div>

          {/* Install button */}
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-[#1B4332] text-base font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-xl relative"
          >
            <Download size={20} />
            Şimdi İndir
          </button>

          {/* Sub text */}
          <p className="text-center text-[10px] text-white/40 mt-3">
            Ücretsiz &middot; Hızlı kurulum &middot; {isIOS ? 'Safari ile yükleyin' : 'Anında yükleyin'}
          </p>
        </div>
      </section>

      <IOSInstallGuide isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  );
}
