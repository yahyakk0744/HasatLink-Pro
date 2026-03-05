import type { ReactNode } from 'react';

interface FABProps {
  onClick: () => void;
  icon: ReactNode;
  className?: string;
}

export default function FAB({ onClick, icon, className = '' }: FABProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-[var(--accent-green)] text-white rounded-full shadow-2xl flex items-center justify-center hover:opacity-90 hover:scale-110 active:scale-95 transition-all duration-200 z-40 ${className}`}
    >
      {icon}
    </button>
  );
}
