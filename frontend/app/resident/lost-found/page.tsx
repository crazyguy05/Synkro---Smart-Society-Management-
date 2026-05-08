"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Plus, MapPin, Calendar, CheckCircle2, ImageIcon } from 'lucide-react';
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
  _id: string; itemName: string; description?: string;
  category: 'Lost' | 'Found'; location: string;
  date?: string; photoUrl?: string;
  status: 'Active' | 'Resolved';
  postedBy?: { _id: string; name?: string };
};

export default function LostFoundPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<'All' | 'Lost' | 'Found'>('All');
  const [filterStatus, setFilterStatus] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    itemName: '', description: '', category: 'Lost' as 'Lost' | 'Found',
    location: '', file: null as File | null,
  });
  const photoRequired = form.category === 'Found';

  const fetchList = async () => {
    try {
      const params = new URLSearchParams();
      if (tab !== 'All') params.set('category', tab);
      if (filterStatus) params.set('status', filterStatus);
      const query = params.toString() ? `?${params.toString()}` : '';
      const list = await api(`/api/lostfound${query}`);
      setItems(Array.isArray(list) ? list : []);
    } catch {}
  };
  useEffect(() => { fetchList(); }, [tab, filterStatus]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(it => !term || `${it.itemName} ${it.location} ${it.description ?? ''}`.toLowerCase().includes(term));
  }, [items, q]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName || !form.location) return;
    if (photoRequired && !form.file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('itemName', form.itemName);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('location', form.location);
      if (form.file) fd.append('photo', form.file);
      const res = await fetch(`${API_BASE}/api/lostfound`, {
        method: 'POST',
        headers: typeof window !== 'undefined' && localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setBanner('Item posted successfully');
      setTimeout(() => setBanner(''), 2500);
      setForm({ itemName: '', description: '', category: 'Lost', location: '', file: null });
      if (fileRef.current) fileRef.current.value = '';
      setOpen(false);
      fetchList();
    } finally { setSaving(false); }
  };

  const markResolved = async (id: string) => {
    try {
      await api(`/api/lostfound/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Resolved' }) });
      fetchList();
    } catch {}
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">Lost & Found</h2>
          <p className="text-sm text-muted">Help neighbours reunite with their belongings.</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>Post Item</Button>
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
            {(['All', 'Lost', 'Found'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${tab === t ? 'bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow' : 'text-[var(--text-muted)]'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Active</option>
            <option>Resolved</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="input pl-10"
              placeholder="Search items or location…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<SearchIcon size={22} />} title="No items" description="Nothing matches your filters." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it, i) => (
            <motion.div key={it._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card hoverable className="p-0 overflow-hidden">
                <div className="relative h-44 bg-[var(--card-muted)]">
                  {it.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.photoUrl} alt={it.itemName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full grid place-items-center text-muted"><ImageIcon size={28} /></div>
                  )}
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <Badge tone={it.category === 'Lost' ? 'rose' : 'emerald'}>{it.category}</Badge>
                    <Badge tone={it.status === 'Resolved' ? 'slate' : 'brand'}>{it.status}</Badge>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="heading text-base">{it.itemName}</h3>
                  {it.description && <p className="text-sm text-muted line-clamp-2">{it.description}</p>}
                  <div className="flex flex-col gap-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{it.location}</span>
                    {it.date && <span className="inline-flex items-center gap-1.5"><Calendar size={12} />{new Date(it.date).toLocaleDateString()}</span>}
                    <span>By {it.postedBy?.name ?? 'Unknown'}</span>
                  </div>
                  {user && it.postedBy?._id === user.id && it.status !== 'Resolved' && (
                    <Button size="sm" variant="ghost" leftIcon={<CheckCircle2 size={13} />} onClick={() => markResolved(it._id)} className="w-full mt-2">
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={open} onClose={() => !saving && setOpen(false)} title="Post Lost or Found Item"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} loading={saving} disabled={!form.itemName || !form.location || (photoRequired && !form.file)}>Post</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Item Name" value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} placeholder="Black wallet" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as 'Lost' | 'Found' }))}>
                <option>Lost</option>
                <option>Found</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Description</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details that help identify the item…" />
          </div>
          <Input label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Near Tower B lobby" />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              Photo {photoRequired ? <span className="text-rose-400">(required)</span> : '(optional)'}
            </label>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))} className="input" />
          </div>
        </form>
      </Modal>
    </Shell>
  );
}
