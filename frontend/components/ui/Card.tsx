import React from 'react';

type Variant = 'default' | 'flat' | 'gradient' | 'glass';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  glass?: boolean;
  hoverable?: boolean;
  variant?: Variant;
  padded?: boolean;
};

export default function Card({
  glass, hoverable, variant, padded = true, className = '', children, ...rest
}: Props) {
  const v: Variant = variant ?? (glass ? 'glass' : 'default');
  const padCls = padded ? 'p-5' : '';
  const hover = hoverable ? 'hover:-translate-y-0.5 hover:shadow-card-lift transition' : '';

  if (v === 'gradient') {
    return (
      <div className={`card-grad ${className}`}>
        <div className={`card-grad-inner ${padCls} ${hover}`} {...rest}>
          {children}
        </div>
      </div>
    );
  }

  const base =
    v === 'flat'  ? 'card-flat' :
    v === 'glass' ? 'glass'     :
                    'card';
  return (
    <div {...rest} className={`${base} ${padCls} ${hover} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title, subtitle, action,
}: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="heading text-[15px] text-[var(--text)]">{title}</h3>
        {subtitle && <p className="text-[12px] text-muted mt-0.5 font-medium">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
