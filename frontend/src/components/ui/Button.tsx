import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

const variants = {
  primary: 'bg-[var(--accent-green)] text-white hover:opacity-90',
  secondary: 'bg-[var(--bg-invert)] text-[var(--text-on-invert)] hover:opacity-80',
  outline: 'border-2 border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
  ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
  danger: 'bg-[var(--accent-red)] text-white hover:opacity-90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export default function Button({ variant = 'primary', size = 'md', children, loading, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`font-semibold tracking-wide rounded-2xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
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
