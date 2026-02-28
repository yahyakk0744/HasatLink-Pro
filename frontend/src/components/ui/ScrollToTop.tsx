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
      className="fixed bottom-24 left-6 md:bottom-8 md:left-8 w-11 h-11 bg-[var(--glass-surface)] backdrop-blur text-[var(--text-primary)] rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--bg-surface)] hover:scale-110 transition-all duration-200 z-40 border border-[var(--border-subtle)] animate-fade-in"
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
