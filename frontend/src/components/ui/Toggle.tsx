interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export default function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 w-[44px] h-[24px] rounded-full transition-colors duration-200"
        style={{ background: checked ? '#2D6A4F' : 'var(--bg-input)' }}
      >
        <span
          className="absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
      {(label || description) && (
        <div>
          {label && <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>}
          {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
}
