"use client";
import { useEffect, useRef, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

function statusBadge(s: string) {
  const map: Record<string, string> = {
    approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  };
  return map[s] || map.pending;
}

export default function GuardVisitorsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    purpose: '',
    flatNumber: '',
    residentEmail: '',
    file: null as File | null,
    photoUrl: '',
  });
  const fileRef = useRef<HTMLInputElement|null>(null);

  useEffect(() => {
    if (!user) return;
    fetchList();
    const id = setInterval(fetchList, 10000);
    return () => clearInterval(id);
  }, [user]);

  async function fetchList() {
    try { setList(await api('/api/visitors')); } catch {}
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, file: f }));
  };

  async function uploadPhotoIfNeeded() {
    if (!form.file) return '';
    const fd = new FormData();
    fd.append('photo', form.file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/visitors/upload`, {
      method: 'POST',
      headers: typeof window !== 'undefined' && localStorage.getItem('token')
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
        : undefined,
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.photoUrl as string;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.purpose || !form.flatNumber || !form.file) return;
    setLoading(true);
    try {
      let photoUrl = form.photoUrl;
      if (!photoUrl && form.file) photoUrl = await uploadPhotoIfNeeded();
      await api('/api/visitors', { method: 'POST', body: JSON.stringify({
        name: form.name,
        purpose: form.purpose,
        flatNumber: form.flatNumber || undefined,
        residentEmail: form.residentEmail,
        photoUrl,
      })});
      setForm({ name: '', purpose: '', flatNumber: '', residentEmail: '', file: null, photoUrl: '' });
      if (fileRef.current) fileRef.current.value = '';
      fetchList();
    } finally { setLoading(false); }
  }

  if (user?.role !== 'guard') {
    return (
      <Shell>
        <div className="p-6">Only guards can access this page.</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="card p-4 border border-white/10 bg-white/5 rounded-xl">
          <h2 className="font-semibold mb-3">Add Visitor</h2>
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Visitor Name" value={form.name} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} />
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Purpose" value={form.purpose} onChange={e=>setForm(f=>({ ...f, purpose: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Flat Number (required)" value={form.flatNumber} onChange={e=>setForm(f=>({ ...f, flatNumber: e.target.value }))} />
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Resident Email (optional)" value={form.residentEmail} onChange={e=>setForm(f=>({ ...f, residentEmail: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="px-3 py-2 rounded bg-white/5 border border-white/10" />
              <button className="btn-glow px-3 py-2 rounded" disabled={loading || !form.name || !form.purpose || !form.flatNumber || !form.file}>{loading ? 'Saving…' : 'Save Visitor'}</button>
            </div>
          </form>
        </div>

        <div className="card p-4 border border-white/10 bg-white/5 rounded-xl">
          <h2 className="font-semibold mb-3">Recent Visitors</h2>
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
                  <div className="text-xs opacity-70">Purpose: {v.purpose || v.reason || 'Visit'} • Flat: {v.flatNumber || '—'}</div>
                </div>
                <span className={`px-2 py-1 rounded border ${statusBadge(v.status)}`}>{v.status}</span>
              </div>
            ))}
            {list.length === 0 && <div className="opacity-70">No visitors yet.</div>}
          </div>
        </div>
      </div>
    </Shell>
  );
}
