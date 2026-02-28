import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 left-6 md:bottom-8 md:left-8 w-11 h-11 bg-white/90 backdrop-blur text-[#1A1A1A] rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 z-40 border border-[#D6D0C8]/50 animate-fade-in"
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
