"use client";
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareWarning, Search as SearchIcon, RefreshCw, Trash2, Clock, UserCog, Wrench, CheckCircle2 } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Badge, { statusTone } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/ui/EmptyState';
import { api } from '../../../lib/api';

type Complaint = {
  _id: string; title?: string; category: string; description: string;
  status: 'pending' | 'in_progress' | 'resolved' | string;
  resident?: { name?: string; email?: string; apartment?: string };
  flatNumber?: string;
  assignedTo?: { _id: string; name?: string } | null;
  history?: Array<{ step: string; at?: string; by?: { name?: string } | string }>;
  createdAt?: string;
};

const STEPS = [
  { key: 'submitted', label: 'Submitted', icon: Clock },
  { key: 'assigned', label: 'Assigned', icon: UserCog },
  { key: 'in_progress', label: 'In Progress', icon: Wrench },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

export default function AdminComplaintsPage() {
  const [list, setList] = useState<Complaint[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [timelineOf, setTimelineOf] = useState<Complaint | null>(null);
  const [banner, setBanner] = useState('');

  const fetchComplaints = async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (category) params.set('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await api(`/api/complaints${query}`);
    setList(Array.isArray(data) ? data : []);
  };
  const fetchStaff = async () => {
    try {
      const users = await api('/api/auth/users?role=staff');
      setStaff(Array.isArray(users) ? users : []);
    } catch {}
  };
  useEffect(() => { fetchComplaints(); }, [filterStatus, category]);
  useEffect(() => { fetchStaff(); }, []);

  const setAssign = async (id: string, assignedTo: string) => {
    try { await api(`/api/complaints/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedTo }) }); await fetchComplaints(); } catch {}
  };
  const updateStatusRemote = async (id: string, status: string) => {
    try { await api(`/api/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await fetchComplaints(); } catch {}
  };
  const deleteComplaint = async (id: string) => {
    if (!confirm('Delete this complaint?')) return;
    try {
      await api(`/api/complaints/${id}`, { method: 'DELETE' });
      setBanner('Complaint deleted');
      setTimeout(() => setBanner(''), 2000);
      await fetchComplaints();
    } catch {}
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(c => `${c.category} ${c.description} ${c.resident?.name || ''} ${c.title || ''}`.toLowerCase().includes(term));
  }, [list, q]);

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">Complaints</h2>
          <p className="text-sm text-muted">Assign staff and track resolution across all tickets.</p>
        </div>
        <Button variant="ghost" leftIcon={<RefreshCw size={14} />} onClick={fetchComplaints}>Refresh</Button>
      </div>

      {banner && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
          {banner}
        </motion.div>
      )}

      <Card className="p-4">
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
          <div className="relative">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="input pl-10"
              placeholder="Search by title, description, resident…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option>Plumbing</option>
            <option>Electricity</option>
            <option>Security</option>
            <option>Housekeeping</option>
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<MessageSquareWarning size={22} />} title="No complaints" description="Nothing matches your filters." />
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <Card key={c._id}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="heading text-base">{c.title || c.category}</h3>
                    <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {c.category} · {c.resident?.name || 'Resident'}{c.flatNumber ? ` · ${c.flatNumber}` : ''}
                  </div>
                  <p className="text-sm text-muted mt-2 line-clamp-2">{c.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select className="input py-1.5 text-xs w-auto" value={c.assignedTo?._id || ''} onChange={e => setAssign(c._id, e.target.value)}>
                    <option value="">Unassigned</option>
                    {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  <select className="input py-1.5 text-xs w-auto" value={c.status} onChange={e => updateStatusRemote(c._id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => setTimelineOf(c)}>Timeline</Button>
                  <button
                    onClick={() => deleteComplaint(c._id)}
                    className="p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <HistoryRail history={c.history ?? []} status={c.status} />
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!timelineOf} onClose={() => setTimelineOf(null)} title="Complaint Timeline" size="md">
        {timelineOf && <HistoryRail history={timelineOf.history ?? []} status={timelineOf.status} detailed />}
      </Modal>
    </Shell>
  );
}

function HistoryRail({ history, status, detailed }: { history: Array<any>; status: string; detailed?: boolean }) {
  const byStep: Record<string, any> = {};
  history.forEach(s => { if (!byStep[s.step]) byStep[s.step] = s; });
  const activeIdx = STEPS.findIndex(s => s.key === status.toLowerCase());
  const currentStep = activeIdx >= 0 ? activeIdx : 0;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i <= currentStep;
          return (
            <div key={s.key} className="flex-1 flex items-center gap-1">
              <div className={`h-7 w-7 rounded-full grid place-items-center flex-shrink-0 ${done ? 'bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                <Icon size={13} />
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${i < currentStep ? 'bg-gradient-to-r from-brand-500 to-accent-violet' : 'bg-white/10'}`} />
              )}
            </div>
          );
        })}
      </div>
      {detailed && (
        <ul className="mt-4 space-y-2">
          {STEPS.map(s => {
            const entry = byStep[s.key];
            const active = !!entry;
            return (
              <li key={s.key} className={`text-sm flex items-center gap-2 ${active ? '' : 'opacity-50'}`}>
                <span className="w-28 text-xs text-muted">{s.label}</span>
                <span className="flex-1 text-xs">
                  {active ? new Date(entry.at || '').toLocaleString() : '—'}
                  {active && (entry.by as any)?.name ? ` · ${(entry.by as any).name}` : ''}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
