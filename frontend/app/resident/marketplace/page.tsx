"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

function typeBadge(t: string) {
  if (t === 'Sell') return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
  if (t === 'Donate') return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
  return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
}

export default function ResidentMarketplacePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState<'All'|'Sell'|'Exchange'|'Donate'>('All');
  const [q, setQ] = useState('');
  const [banner, setBanner] = useState('');
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Exchange' as 'Sell'|'Exchange'|'Donate',
    askingItem: '',
    price: '' as any,
    contact: '',
    file: null as File | null,
  });

  async function fetchList() {
    const params = new URLSearchParams();
    if (tab !== 'All') params.set('type', tab);
    const query = params.toString() ? `?${params.toString()}` : '';
    try { const list = await api(`/api/marketplace${query}`); setItems(Array.isArray(list) ? list : []); } catch {}
  }

  useEffect(() => { fetchList(); }, [tab]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (term) {
        const s = `${it.title} ${it.description}`.toLowerCase();
        if (!s.includes(term)) return false;
      }
      return true;
    });
  }, [items, q]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.contact) return;
    if (form.type === 'Sell' && !form.price) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('type', form.type);
      if (form.type === 'Exchange' && form.askingItem) fd.append('askingItem', form.askingItem);
      if (form.type === 'Sell' && form.price) fd.append('price', String(form.price));
      fd.append('contact', form.contact);
      if (form.file) fd.append('photo', form.file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/marketplace`, {
        method: 'POST',
        headers: typeof window !== 'undefined' && localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
          : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setBanner('✅ Listing posted successfully!');
      setTimeout(()=>setBanner(''), 2500);
      setForm({ title: '', description: '', type: 'Exchange', askingItem: '', price: '', contact: '', file: null });
      if (fileRef.current) fileRef.current.value='';
      fetchList();
    } finally { setSaving(false); }
  }

  async function markClosed(id: string) {
    try {
      await api(`/api/marketplace/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Closed' }) });
      setBanner('✔️ Marked as Closed');
      setTimeout(()=>setBanner(''), 1500);
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
          <h2 className="font-semibold mb-3">New Marketplace Listing</h2>
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Title" value={form.title} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} />
              <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={form.type} onChange={e=>setForm(f=>({ ...f, type: e.target.value as any }))}>
                <option>Sell</option>
                <option>Exchange</option>
                <option>Donate</option>
              </select>
            </div>
            <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10 min-h-[90px]" placeholder="Description" value={form.description} onChange={e=>setForm(f=>({ ...f, description: e.target.value }))} />
            {form.type === 'Exchange' && (
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Looking for (e.g., Keyboard)" value={form.askingItem} onChange={e=>setForm(f=>({ ...f, askingItem: e.target.value }))} />
            )}
            {form.type === 'Sell' && (
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Price" type="number" value={form.price} onChange={e=>setForm(f=>({ ...f, price: e.target.value }))} />
            )}
            <div className="grid grid-cols-2 gap-3 items-center">
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Contact (phone or email)" value={form.contact} onChange={e=>setForm(f=>({ ...f, contact: e.target.value }))} />
              <input ref={fileRef} type="file" accept="image/*" onChange={e=>setForm(f=>({ ...f, file: e.target.files?.[0] || null }))} className="px-3 py-2 rounded bg-white/5 border border-white/10" />
            </div>
            <div className="flex justify-end">
              <button className="btn-glow px-3 py-2 rounded" disabled={saving || !form.title || !form.description || !form.contact || (form.type==='Sell' && !form.price)}>{saving ? 'Posting…' : 'Post Listing'}</button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            <button className={`px-3 py-2 rounded border ${tab==='All'?'bg-white/10':'bg-white/5'} border-white/10`} onClick={()=>setTab('All')}>All</button>
            <button className={`px-3 py-2 rounded border ${tab==='Sell'?'bg-white/10':'bg-white/5'} border-white/10`} onClick={()=>setTab('Sell')}>Sell</button>
            <button className={`px-3 py-2 rounded border ${tab==='Exchange'?'bg-white/10':'bg-white/5'} border-white/10`} onClick={()=>setTab('Exchange')}>Exchange</button>
            <button className={`px-3 py-2 rounded border ${tab==='Donate'?'bg-white/10':'bg-white/5'} border-white/10`} onClick={()=>setTab('Donate')}>Donate</button>
          </div>
          <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Search by title or description" value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((it) => (
            <div key={it._id} className="p-3 rounded border border-white/10 bg-white/5 flex flex-col gap-3">
              {it.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.photoUrl} alt={it.title} className="w-full h-40 object-cover rounded" />
              ) : (
                <div className="w-full h-40 rounded bg-white/10 flex items-center justify-center text-xs opacity-70">No Photo</div>
              )}
              <div className="flex items-center justify-between">
                <div className="font-medium">{it.title}</div>
                <span className={`px-2 py-0.5 rounded border text-xs ${typeBadge(it.type)}`}>{it.type}</span>
              </div>
              <div className="text-sm opacity-80">{it.description}</div>
              <div className="text-xs opacity-70 flex flex-col gap-1">
                {it.type==='Sell' && <span>Price: ₹{it.price}</span>}
                {it.type==='Exchange' && it.askingItem && <span>Looking For: {it.askingItem}</span>}
                <span>Contact: {it.contact}</span>
                <span>Posted: {new Date(it.createdAt).toLocaleString()}</span>
              </div>
              {user && it.postedBy && it.postedBy._id === user.id && (
                <button className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60" disabled={it.status==='Closed'} onClick={()=>markClosed(it._id)}>
                  {it.status==='Closed' ? 'Closed' : 'Mark as Traded'}
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="opacity-70">No listings found.</div>}
        </div>
      </div>
    </Shell>
  );
}
