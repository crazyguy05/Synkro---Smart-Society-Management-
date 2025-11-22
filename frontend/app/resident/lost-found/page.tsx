"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

function statusBadge(s: string) {
  return s === 'Resolved'
    ? 'bg-gray-500/20 text-gray-200 border-gray-500/30'
    : 'bg-blue-500/20 text-blue-200 border-blue-500/30';
}

function categoryBadge(c: string) {
  return c === 'Lost'
    ? 'bg-red-500/20 text-red-200 border-red-500/30'
    : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
}

export default function LostFoundPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState<'All'|'Lost'|'Found'>('All');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [q, setQ] = useState('');
  const [banner, setBanner] = useState('');
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    itemName: '',
    description: '',
    category: 'Lost' as 'Lost'|'Found',
    location: '',
    file: null as File | null,
  });
  const photoRequired = form.category === 'Found';

  async function fetchList() {
    try {
      const params = new URLSearchParams();
      if (tab !== 'All') params.set('category', tab);
      if (filterStatus) params.set('status', filterStatus);
      if (q) params.set('q', q);
      const query = params.toString() ? `?${params.toString()}` : '';
      const list = await api(`/api/lostfound${query}`);
      setItems(Array.isArray(list) ? list : []);
    } catch {}
  }

  useEffect(() => { fetchList(); }, [tab, filterStatus]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (term) {
        const s = `${it.itemName} ${it.location} ${it.description}`.toLowerCase();
        if (!s.includes(term)) return false;
      }
      return true;
    });
  }, [items, q]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.itemName || !form.category || !form.location) return;
    if (photoRequired && !form.file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('itemName', form.itemName);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('location', form.location);
      if (form.file) fd.append('photo', form.file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/lostfound`, {
        method: 'POST',
        headers: typeof window !== 'undefined' && localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
          : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setBanner('✅ Item posted successfully!');
      setTimeout(()=>setBanner(''), 3000);
      setForm({ itemName: '', description: '', category: 'Lost', location: '', file: null });
      if (fileRef.current) fileRef.current.value='';
      fetchList();
    } finally { setSaving(false); }
  }

  async function markResolved(id: string) {
    try {
      await api(`/api/lostfound/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Resolved' }) });
      setBanner('🎉 Marked as Resolved');
      setTimeout(()=>setBanner(''), 2000);
      fetchList();
    } catch {}
  }

  return (
    <Shell>
      <div className="grid gap-6">
        {banner && (
          <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">{banner}</div>
        )}

        <div className="card p-4 border border-white/10 bg-white/5 rounded-xl">
          <h2 className="font-semibold mb-3">New Lost & Found Post</h2>
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Item Name" value={form.itemName} onChange={e=>setForm(f=>({ ...f, itemName: e.target.value }))} />
              <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={form.category} onChange={e=>setForm(f=>({ ...f, category: e.target.value as 'Lost'|'Found' }))}>
                <option>Lost</option>
                <option>Found</option>
              </select>
            </div>
            <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10 min-h-[90px]" placeholder="Description" value={form.description} onChange={e=>setForm(f=>({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3 items-center">
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Location" value={form.location} onChange={e=>setForm(f=>({ ...f, location: e.target.value }))} />
              <input ref={fileRef} type="file" accept="image/*" onChange={e=>setForm(f=>({ ...f, file: e.target.files?.[0] || null }))} className="px-3 py-2 rounded bg-white/5 border border-white/10" />
            </div>
            {photoRequired ? (
              <div className="text-xs opacity-70 -mt-2">Photo is required for Found items.</div>
            ) : (
              <div className="text-xs opacity-70 -mt-2">Photo is optional for Lost items.</div>
            )}
            <div className="flex justify-end">
              <button className="btn-glow px-3 py-2 rounded" disabled={saving || !form.itemName || !form.category || !form.location || (photoRequired && !form.file)}>{saving ? 'Posting…' : 'Post Item'}</button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            <button className={`px-3 py-2 rounded border ${tab==='All'?'bg-white/10':'bg-white/5'} border-white/10`} onClick={()=>setTab('All')}>Show All</button>
            <button className={`px-3 py-2 rounded border ${tab==='Lost'?'bg-white/10':'bg-white/5'} border-white/10`} onClick={()=>setTab('Lost')}>Lost Only</button>
            <button className={`px-3 py-2 rounded border ${tab==='Found'?'bg-white/10':'bg-white/5'} border-white/10`} onClick={()=>setTab('Found')}>Found Only</button>
            <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option>Active</option>
              <option>Resolved</option>
            </select>
          </div>
          <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Search by item or location" value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        <div className="grid gap-3">
          {filtered.map((it) => (
            <div key={it._id} className="p-3 rounded border border-white/10 bg-white/5 flex items-center gap-3">
              {it.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.photoUrl} alt={it.itemName} className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 rounded bg-white/10 flex items-center justify-center text-xs opacity-70">No Photo</div>
              )}
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  <span>{it.itemName}</span>
                  <span className={`px-2 py-0.5 rounded border text-xs ${categoryBadge(it.category)}`}>{it.category}</span>
                  <span className={`px-2 py-0.5 rounded border text-xs ${statusBadge(it.status)}`}>{it.status}</span>
                </div>
                <div className="text-xs opacity-70">{it.description || '—'}</div>
                <div className="text-xs opacity-70">Location: {it.location || '—'} • Date: {it.date ? new Date(it.date).toLocaleDateString() : '—'} • Posted By: {it.postedBy?.name || '—'}</div>
              </div>
              {user && it.postedBy && it.postedBy._id === user.id && it.status !== 'Resolved' && (
                <button className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={()=>markResolved(it._id)}>Mark Resolved</button>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="opacity-70">No items found.</div>}
        </div>
      </div>
    </Shell>
  );
}

