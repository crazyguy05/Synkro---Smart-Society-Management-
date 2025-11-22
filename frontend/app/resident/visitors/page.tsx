"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

function badge(status: string) {
  return status === 'Allowed'
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : status === 'Denied'
    ? 'bg-red-500/20 text-red-300 border-red-500/30'
    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
}

export default function ResidentVisitorsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [banner, setBanner] = useState<string>('');
  const notifiedRef = useRef(false);
  const [needsClickForSound, setNeedsClickForSound] = useState(false);

  async function fetchList() {
    try {
      const email = user?.email;
      const flat = (user as any)?.apartment; // backend returns apartment; type may not include it
      const params = new URLSearchParams();
      if (email) params.set('email', email);
      if (flat) params.set('flat', flat);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api(`/api/visitors${query}`);
      setList(Array.isArray(data) ? data : []);
    } catch {}
  }

  useEffect(() => {
    if (!user) return;
    fetchList();
    // Check for new visitors since last login and alert once
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
            showBanner(`🔔 ${data.count} new visitor request(s) are waiting for your approval.`);
          }
        } catch {}
        notifiedRef.current = true;
      })();
    }
    const id = setInterval(fetchList, 10000);
    return () => clearInterval(id);
  }, [user]);

  // After visiting the page, update lastLoginAt to now
  useEffect(() => {
    if (!user) return;
    api('/api/auth/updateLoginTime', { method: 'POST' }).catch(() => {});
  }, [user]);

  function showBanner(msg: string) {
    setBanner(msg);
    setTimeout(() => setBanner(''), 5000);
  }

  async function playAlertSound() {
    try {
      const audio = new Audio('/sounds/alert.mp3');
      await audio.play();
      return true;
    } catch {
      try { fallbackBeep(); return false; } catch { return false; }
    }
  }

  function fallbackBeep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      o.start();
      setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02); o.stop(); }, 300);
    } catch {}
  }

  const stats = useMemo(() => {
    const total = list.length;
    const pending = list.filter(v => v.status === 'Pending' || v.status === 'pending').length;
    const allowed = list.filter(v => v.status === 'Allowed' || v.status === 'approved').length;
    const denied = list.filter(v => v.status === 'Denied' || v.status === 'rejected').length;
    return { total, pending, allowed, denied };
  }, [list]);

  async function setStatus(id: string, status: 'Allowed'|'Denied') {
    try { await api(`/api/visitors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); fetchList(); } catch {}
  }

  if (user?.role !== 'resident') {
    return (
      <Shell>
        <div className="p-6">Only residents can access this page.</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-6">
        {banner && (
          <div className="p-3 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-200">
            {banner}
            {needsClickForSound && (
              <button
                className="ml-3 px-2 py-1 text-xs rounded border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={async ()=>{ const ok = await playAlertSound(); if (ok) setNeedsClickForSound(false); }}
              >Play sound</button>
            )}
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Total</div><div className="text-2xl font-semibold">{stats.total}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Pending</div><div className="text-2xl font-semibold">{stats.pending}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Allowed</div><div className="text-2xl font-semibold">{stats.allowed}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Denied</div><div className="text-2xl font-semibold">{stats.denied}</div></div>
        </div>

        <div className="card p-4 border border-white/10 bg-white/5 rounded-xl">
          <h2 className="font-semibold mb-3">Visitors to my flat</h2>
          <div className="grid gap-3">
            {list.map(v => (
              <div key={v._id} className="p-3 rounded border border-white/10 bg-white/5 flex items-center gap-3">
                {v.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.photoUrl} alt={v.name} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 rounded bg-white/10 flex items-center justify-center text-xs opacity-70">No Photo</div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs opacity-70">Purpose: {v.purpose || v.reason || 'Visit'} • Flat: {v.flatNumber || (user as any)?.apartment || '—'}</div>
                </div>
                <span className={`px-2 py-1 rounded border ${badge(v.status)}`}>{v.status}</span>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={()=>setStatus(v._id, 'Allowed')}>Allow</button>
                  <button className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={()=>setStatus(v._id, 'Denied')}>Deny</button>
                </div>
              </div>
            ))}
            {list.length === 0 && <div className="opacity-70">No visitors yet.</div>}
          </div>
        </div>
      </div>
    </Shell>
  );
}
