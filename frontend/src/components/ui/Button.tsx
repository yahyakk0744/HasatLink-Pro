import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

const variants = {
  primary: 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]',
  secondary: 'bg-[#1A1A1A] text-white hover:bg-[#3D3530]',
  outline: 'border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white',
  ghost: 'text-[#6B6560] hover:bg-[#F5F3EF]',
  danger: 'bg-[#C1341B] text-white hover:bg-[#A02B16]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export default function Button({ variant = 'primary', size = 'md', children, loading, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`font-semibold tracking-wide rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </span>
      ) : children}
    </button>
  );
}
