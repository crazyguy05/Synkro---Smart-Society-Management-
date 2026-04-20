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

export default function Badge({ tone = 'slate', children, className = '' }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={`${tones[tone]} ${className}`}>{children}</span>;
}

export function statusTone(status?: string): Tone {
  const s = (status || '').toLowerCase();
  if (['paid', 'resolved', 'allowed', 'approved', 'active', 'closed'].includes(s)) return 'emerald';
  if (['overdue', 'rejected', 'denied', 'high'].includes(s)) return 'rose';
  if (['pending', 'submitted', 'in_progress', 'in progress', 'assigned', 'medium'].includes(s)) return 'amber';
  if (['low'].includes(s)) return 'brand';
  return 'slate';
}
