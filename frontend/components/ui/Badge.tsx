import React from 'react';

type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
const tones: Record<Tone, string> = {
  brand: 'badge-brand',
  emerald: 'badge-emerald',
  amber: 'badge-amber',
  rose: 'badge-rose',
  violet: 'badge-violet',
  slate: 'badge-slate',
};
const dotColor: Record<Tone, string> = {
  brand: '#2563eb',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#ef4444',
  violet: '#8b5cf6',
  slate: '#94a3b8',
};

export default function Badge({
  tone = 'slate',
  dot = false,
  children,
  className = '',
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`${tones[tone]} ${className}`}>
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor[tone] }}
        />
      )}
      {children}
    </span>
  );
}

export function statusTone(status?: string): Tone {
  const s = (status || '').toLowerCase();
  if (['paid', 'resolved', 'allowed', 'approved', 'active', 'closed', 'confirmed'].includes(s)) return 'emerald';
  if (['overdue', 'rejected', 'denied', 'high'].includes(s)) return 'rose';
  if (['pending', 'submitted', 'in_progress', 'in progress', 'assigned', 'medium'].includes(s)) return 'amber';
  if (['low'].includes(s)) return 'brand';
  return 'slate';
}
