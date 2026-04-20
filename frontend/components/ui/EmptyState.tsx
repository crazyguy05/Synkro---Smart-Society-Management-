import React from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-10 text-center space-y-3">
      {icon && <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 grid place-items-center">{icon}</div>}
      <h4 className="heading text-base">{title}</h4>
      {description && <p className="text-sm text-muted max-w-sm mx-auto">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
