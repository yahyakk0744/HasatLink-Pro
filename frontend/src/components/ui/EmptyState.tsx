import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-20 h-20 rounded-full bg-[#F5F3EF] flex items-center justify-center text-[#D6D0C8] mb-4 empty-float">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold tracking-tight text-[#1A1A1A] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#6B6560] mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
