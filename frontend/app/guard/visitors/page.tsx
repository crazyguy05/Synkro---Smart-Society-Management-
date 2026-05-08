"use client";
import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ImageIcon, Plus } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Badge, { statusTone } from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { api, API_BASE } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

type Visitor = {
  _id: string; name: string; purpose?: string; reason?: string;
  flatNumber?: string; status: string; photoUrl?: string; createdAt?: string;
};

export default function GuardVisitorsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', purpose: '', flatNumber: '', residentEmail: '',
    file: null as File | null, photoUrl: '',
  });
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchList();
    const id = setInterval(fetchList, 10000);
    return () => clearInterval(id);
  }, [user]);

  const fetchList = async () => {
    try { setList(await api('/api/visitors')); } catch {}
  };

  const uploadPhotoIfNeeded = async () => {
    if (!form.file) return '';
    const fd = new FormData();
    fd.append('photo', form.file);
    const res = await fetch(`${API_BASE}/api/visitors/upload`, {
      method: 'POST',
      headers: typeof window !== 'undefined' && localStorage.getItem('token')
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : undefined,
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.photoUrl as string;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.purpose || !form.flatNumber || !form.file) return;
    setLoading(true);
    try {
      const photoUrl = form.photoUrl || (await uploadPhotoIfNeeded());
      await api('/api/visitors', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name, purpose: form.purpose,
          flatNumber: form.flatNumber || undefined,
          residentEmail: form.residentEmail, photoUrl,
        }),
      });
      setForm({ name: '', purpose: '', flatNumber: '', residentEmail: '', file: null, photoUrl: '' });
      if (fileRef.current) fileRef.current.value = '';
      fetchList();
    } finally { setLoading(false); }
  };

  return (
    <Shell>
      <div>
        <h2 className="heading text-2xl">Visitor Entry</h2>
        <p className="text-sm text-muted">Log new visitors and track approvals in real time.</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-400 grid place-items-center">
            <Plus size={18} />
          </div>
          <h3 className="heading text-lg">Add Visitor</h3>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Visitor Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            <Input label="Purpose" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Delivery, guest, maintenance…" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Flat Number" value={form.flatNumber} onChange={e => setForm(f => ({ ...f, flatNumber: e.target.value }))} />
            <Input label="Resident Email (optional)" value={form.residentEmail} onChange={e => setForm(f => ({ ...f, residentEmail: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Photo <span className="text-rose-400">(required)</span></label>
            <input ref={fileRef} type="file" accept="image/*"
              onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
              className="input"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!form.name || !form.purpose || !form.flatNumber || !form.file}>Save Visitor</Button>
          </div>
        </form>
      </Card>

      <div>
        <h3 className="heading text-lg mb-3">Recent Visitors</h3>
        {list.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={22} />} title="No visitors logged" description="Entries you add will appear here." />
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
                      {v.purpose || v.reason || 'Visit'} · Flat {v.flatNumber || '—'} · {v.createdAt ? new Date(v.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                  <Badge tone={statusTone(v.status)}>{v.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
