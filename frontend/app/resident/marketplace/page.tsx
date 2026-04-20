"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search as SearchIcon, Phone, ImageIcon, CheckCircle2, Tag, Repeat, Gift } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { api, API_BASE } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

type Item = {
  _id: string; title: string; description: string;
  type: 'Sell' | 'Exchange' | 'Donate';
  askingItem?: string; price?: number; contact: string;
  photoUrl?: string; status: 'Active' | 'Closed';
  postedBy?: { _id: string; name?: string };
  createdAt: string;
};

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

export default function ResidentMarketplacePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<'All' | 'Sell' | 'Exchange' | 'Donate'>('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'Exchange' as 'Sell' | 'Exchange' | 'Donate',
    askingItem: '', price: '', contact: '', file: null as File | null,
  });

  const fetchList = async () => {
    const params = new URLSearchParams();
    if (tab !== 'All') params.set('type', tab);
    const query = params.toString() ? `?${params.toString()}` : '';
    try { const list = await api(`/api/marketplace${query}`); setItems(Array.isArray(list) ? list : []); } catch {}
  };
  useEffect(() => { fetchList(); }, [tab]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(it => !term || `${it.title} ${it.description}`.toLowerCase().includes(term));
  }, [items, q]);

  const submit = async (e: React.FormEvent) => {
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
      const res = await fetch(`${API_BASE}/api/marketplace`, {
        method: 'POST',
        headers: typeof window !== 'undefined' && localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setBanner('Listing posted');
      setTimeout(() => setBanner(''), 2500);
      setForm({ title: '', description: '', type: 'Exchange', askingItem: '', price: '', contact: '', file: null });
      if (fileRef.current) fileRef.current.value = '';
      setOpen(false);
      fetchList();
    } finally { setSaving(false); }
  };

  const markClosed = async (id: string) => {
    try { await api(`/api/marketplace/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Closed' }) }); fetchList(); } catch {}
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">Marketplace</h2>
          <p className="text-sm text-muted">Sell, exchange or donate within your society.</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>New Listing</Button>
      </div>

      {banner && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
          {banner}
        </motion.div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-[var(--card-muted)] border border-[var(--border)] p-1">
            {(['All', 'Sell', 'Exchange', 'Donate'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${tab === t ? 'bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow' : 'text-[var(--text-muted)]'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="input pl-10"
              placeholder="Search listings…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<Tag size={22} />} title="No listings" description="Be the first to post!" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it, i) => (
            <motion.div key={it._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card hoverable className="p-0 overflow-hidden">
                <div className="relative h-44 bg-[var(--card-muted)]">
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
                  {it.type === 'Sell' && it.price != null && (
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-white text-sm font-semibold">
                      ₹{it.price.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="heading text-base">{it.title}</h3>
                  <p className="text-sm text-muted line-clamp-2">{it.description}</p>
                  <div className="flex flex-col gap-1 text-xs text-muted">
                    {it.type === 'Exchange' && it.askingItem && <span>Looking for: {it.askingItem}</span>}
                    <span className="inline-flex items-center gap-1.5"><Phone size={12} />{it.contact}</span>
                    <span>By {it.postedBy?.name ?? 'Unknown'} · {new Date(it.createdAt).toLocaleDateString()}</span>
                  </div>
                  {user && it.postedBy?._id === user.id && it.status !== 'Closed' && (
                    <Button size="sm" variant="ghost" leftIcon={<CheckCircle2 size={13} />} onClick={() => markClosed(it._id)} className="w-full mt-2">
                      Mark as Traded
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={open} onClose={() => !saving && setOpen(false)} title="New Listing"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} loading={saving} disabled={!form.title || !form.description || !form.contact || (form.type === 'Sell' && !form.price)}>Post</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Samsung washing machine" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                <option>Sell</option>
                <option>Exchange</option>
                <option>Donate</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Description</label>
            <textarea className="input min-h-[90px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          {form.type === 'Exchange' && (
            <Input label="Looking for" value={form.askingItem} onChange={e => setForm(f => ({ ...f, askingItem: e.target.value }))} placeholder="e.g. Cycle" />
          )}
          {form.type === 'Sell' && (
            <Input label="Price (₹)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          )}
          <Input label="Contact" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone or email" />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Photo (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))} className="input" />
          </div>
        </form>
      </Modal>
    </Shell>
  );
}
