import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-4 py-3 bg-[var(--bg-input)] border border-transparent rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-green)] focus:ring-4 focus:ring-[var(--focus-ring)] focus:bg-[var(--focus-bg)] transition-all ${error ? 'border-[var(--accent-red)]' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[var(--accent-red)] text-xs mt-1">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
