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
      className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-[#2D6A4F] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#1B4332] hover:scale-110 active:scale-95 transition-all duration-200 z-40 fab-attention ${className}`}
    >
      {icon}
    </button>
  );
}
