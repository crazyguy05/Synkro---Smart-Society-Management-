import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  glass?: boolean;
  hoverable?: boolean;
};

export default function Card({ glass, hoverable, className = '', children, ...rest }: Props) {
  const base = glass ? 'glass p-5' : 'card p-5';
  const hover = hoverable ? 'transition-transform hover:-translate-y-0.5 hover:shadow-glow' : '';
  return (
    <div {...rest} className={`${base} ${hover} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="heading text-lg">{title}</h3>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
