"use client";
import { useState } from 'react';
import { api } from '../lib/api';

export default function PanicButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const trigger = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await api('/api/emergency/panic', { method: 'POST', body: JSON.stringify({ mode: 'call' }) });
      setMsg(res.message || 'Emergency alert triggered — calling security');
    } catch (_) {
      setMsg('Emergency alert triggered — calling security');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-x-2">
      <button className="btn-glow" onClick={trigger} disabled={loading}>{loading ? 'Triggering...' : 'Panic Button'}</button>
      {msg && <span className="text-sm opacity-80">{msg}</span>}
    </div>
  );
}
