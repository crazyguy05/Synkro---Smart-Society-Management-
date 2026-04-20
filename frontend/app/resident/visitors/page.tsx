"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserX, BellRing, ImageIcon } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Badge, { statusTone } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

type Visitor = {
  _id: string; name: string; purpose?: string; reason?: string;
  flatNumber?: string; status: string; photoUrl?: string; createdAt?: string;
};

const isPending  = (s: string) => /^pending$/i.test(s);
const isAllowed  = (s: string) => /^(allowed|approved)$/i.test(s);
const isDenied   = (s: string) => /^(denied|rejected)$/i.test(s);

export default function ResidentVisitorsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Visitor[]>([]);
  const [banner, setBanner] = useState('');
  const notifiedRef = useRef(false);
  const [needsClickForSound, setNeedsClickForSound] = useState(false);

  const fetchList = async () => {
    try {
      const email = user?.email;
      const flat = (user as any)?.apartment;
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      if (flat) params.set('flat', flat);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api(`/api/visitors${query}`);
      setList(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    fetchList();
    if (!notifiedRef.current) {
      (async () => {
        try {
          const email = user?.email;
          const flat = (user as any)?.apartment;
          const params = new URLSearchParams();
          if (email) params.set('email', email);
          if (flat) params.set('flat', flat);
          const data = await api(`/api/visitors/new?${params.toString()}`);
          if (data?.count > 0) {
            const ok = await playAlertSound();
            if (!ok) setNeedsClickForSound(true);
            setBanner(`${data.count} new visitor request(s) awaiting your approval.`);
            setTimeout(() => setBanner(''), 6000);
          }
        } catch {}
        notifiedRef.current = true;
      })();
    }
    const id = setInterval(fetchList, 10000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api('/api/auth/updateLoginTime', { method: 'POST' }).catch(() => {});
  }, [user]);

  const playAlertSound = async () => {
    try { const audio = new Audio('/sounds/alert.mp3'); await audio.play(); return true; }
    catch { try { fallbackBeep(); return false; } catch { return false; } }
  };
  const fallbackBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      o.start();
      setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02); o.stop(); }, 300);
    } catch {}
  };

  const stats = useMemo(() => ({
    total: list.length,
    pending: list.filter(v => isPending(v.status)).length,
    allowed: list.filter(v => isAllowed(v.status)).length,
    denied: list.filter(v => isDenied(v.status)).length,
  }), [list]);

  const setStatus = async (id: string, status: 'Allowed' | 'Denied') => {
    try { await api(`/api/visitors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); fetchList(); } catch {}
  };

  return (
    <Shell>
      <div>
        <h2 className="heading text-2xl">Visitor Requests</h2>
        <p className="text-sm text-muted">Approve or deny visitors at your flat.</p>
      </div>

      {banner && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm flex items-center gap-2">
          <BellRing size={16} />
          <span className="flex-1">{banner}</span>
          {needsClickForSound && (
            <Button size="sm" variant="ghost" onClick={async () => { const ok = await playAlertSound(); if (ok) setNeedsClickForSound(false); }}>
              Play sound
            </Button>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total" value={stats.total} tone="brand" />
        <Stat label="Pending" value={stats.pending} tone="amber" />
        <Stat label="Allowed" value={stats.allowed} tone="emerald" />
        <Stat label="Denied" value={stats.denied} tone="rose" />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<UserCheck size={22} />} title="No visitors" description="Visitor requests will appear here." />
      ) : (
        <div className="grid gap-3">
          {list.map(v => (
            <Card key={v._id}>
              <div className="flex items-center gap-4">
                {v.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.photoUrl} alt={v.name} className="w-16 h-16 object-cover rounded-xl" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[var(--card-muted)] grid place-items-center text-muted"><ImageIcon size={20} /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-muted">
                    {v.purpose || v.reason || 'Visit'} · Flat {v.flatNumber || (user as any)?.apartment || '—'}
                  </div>
                </div>
                <Badge tone={statusTone(v.status)}>{v.status}</Badge>
                {isPending(v.status) && (
                  <div className="flex gap-2">
                    <Button size="sm" leftIcon={<UserCheck size={13} />} onClick={() => setStatus(v._id, 'Allowed')}>Allow</Button>
                    <Button size="sm" variant="danger" leftIcon={<UserX size={13} />} onClick={() => setStatus(v._id, 'Denied')}>Deny</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'brand' | 'emerald' | 'amber' | 'rose' }) {
  const bg: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
  };
  return (
    <div className="card p-4">
      <div className={`h-9 w-9 rounded-xl grid place-items-center mb-3 ${bg[tone]}`}>
        <UserCheck size={17} />
      </div>
      <div className="text-xs text-muted">{label}</div>
      <div className="heading text-2xl mt-0.5">{value}</div>
    </div>
  );
}
