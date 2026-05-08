"use client";
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Trash2, Store, ImageIcon, RefreshCw, Tag, Repeat, Gift } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { api } from '../../../lib/api';

function typeIcon(t: string) {
  if (t === 'Sell') return <Tag size={12} />;
  if (t === 'Exchange') return <Repeat size={12} />;
  return <Gift size={12} />;
}
function typeTone(t: string): 'brand' | 'amber' | 'emerald' {
  if (t === 'Sell') return 'brand';
  if (t === 'Exchange') return 'amber';
  return 'emerald';
}

export default function AdminMarketplacePage() {
  const [items, setItems] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [q, setQ] = useState('');
  const [banner, setBanner] = useState('');

  const fetchList = async () => {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (filterStatus) params.set('status', filterStatus);
    const query = params.toString() ? `?${params.toString()}` : '';
    try { const list = await api(`/api/marketplace${query}`); setItems(Array.isArray(list) ? list : []); } catch {}
  };
  useEffect(() => { fetchList(); }, [filterType, filterStatus]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(it => `${it.title} ${it.description}`.toLowerCase().includes(term));
  }, [items, q]);

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await api(`/api/marketplace/${id}`, { method: 'DELETE' });
      setBanner('Listing deleted');
      setTimeout(() => setBanner(''), 2000);
      fetchList();
    } catch {}
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">Marketplace Moderation</h2>
          <p className="text-sm text-muted">Review all listings and remove problematic ones.</p>
        </div>
        <Button variant="ghost" leftIcon={<RefreshCw size={14} />} onClick={fetchList}>Refresh</Button>
      </div>

      {banner && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
          {banner}
        </motion.div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <select className="input w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option>Sell</option><option>Exchange</option><option>Donate</option>
          </select>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Active</option><option>Closed</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input className="input pl-10" placeholder="Search listings…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<Store size={22} />} title="No listings" description="Nothing matches your filters." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(it => (
            <Card key={it._id} className="p-0 overflow-hidden">
              <div className="relative h-40 bg-[var(--card-muted)]">
                {it.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.photoUrl} alt={it.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full grid place-items-center text-muted"><ImageIcon size={28} /></div>
                )}
                <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                  <Badge tone={typeTone(it.type)}>{typeIcon(it.type)} {it.type}</Badge>
                  {it.status === 'Closed' && <Badge tone="slate">Closed</Badge>}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="heading text-base">{it.title}</h3>
                  {it.type === 'Sell' && <span className="font-semibold">₹{it.price}</span>}
                </div>
                <p className="text-sm text-muted line-clamp-2">{it.description}</p>
                <div className="text-xs text-muted space-y-0.5">
                  {it.type === 'Exchange' && it.askingItem && <div>Looking for: {it.askingItem}</div>}
                  <div>Contact: {it.contact}</div>
                  <div>By {it.postedBy?.name ?? 'Unknown'} · {new Date(it.createdAt).toLocaleDateString()}</div>
                </div>
                <Button size="sm" variant="danger" leftIcon={<Trash2 size={13} />} onClick={() => deleteItem(it._id)} className="w-full mt-2">
                  Delete Listing
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
