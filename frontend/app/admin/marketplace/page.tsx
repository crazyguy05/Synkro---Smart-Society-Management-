"use client";
import { useEffect, useMemo, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';

function typeBadge(t: string) {
  if (t === 'Sell') return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
  if (t === 'Donate') return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
  return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
}

export default function AdminMarketplacePage() {
  const [items, setItems] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [q, setQ] = useState('');
  const [banner, setBanner] = useState('');

  async function fetchList() {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (filterStatus) params.set('status', filterStatus);
    if (q) params.set('q', q);
    const query = params.toString() ? `?${params.toString()}` : '';
    try { const list = await api(`/api/marketplace${query}`); setItems(Array.isArray(list) ? list : []); } catch {}
  }

  useEffect(() => { fetchList(); }, [filterType, filterStatus]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it: any) => (`${it.title} ${it.description}`).toLowerCase().includes(term));
  }, [items, q]);

  async function deleteItem(id: string) {
    if (!confirm('Delete this listing?')) return;
    try {
      await api(`/api/marketplace/${id}`, { method: 'DELETE' });
      setBanner('🗑️ Listing deleted successfully');
      setTimeout(()=>setBanner(''), 2000);
      fetchList();
    } catch {}
  }

  return (
    <Shell>
      <div className="grid gap-4">
        {banner && <div className="p-2 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">{banner}</div>}
        <div className="flex items-center gap-2 flex-wrap">
          <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={filterType} onChange={e=>setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option>Sell</option>
            <option>Exchange</option>
            <option>Donate</option>
          </select>
          <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Active</option>
            <option>Closed</option>
          </select>
          <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="px-3 py-2 rounded border border-white/10 bg-white/5" onClick={fetchList}>Refresh</button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((it: any) => (
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
                <span>Posted By: {it.postedBy?.name || '—'}</span>
                <span>Status: {it.status}</span>
                <span>Posted: {new Date(it.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-end">
                <button className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20" onClick={()=>deleteItem(it._id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="opacity-70">No listings found.</div>}
        </div>
      </div>
    </Shell>
  );
}
