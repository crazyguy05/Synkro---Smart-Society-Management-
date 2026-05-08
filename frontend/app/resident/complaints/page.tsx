"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareWarning, Plus, Clock, UserCog, Wrench, CheckCircle2 } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Badge, { statusTone } from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { api } from '../../../lib/api';

type Complaint = {
  _id: string; title?: string; category: string; description: string; status: string;
  flatNumber?: string; createdAt?: string; updatedAt?: string;
  timeline?: Array<{ stage: string; timestamp?: string; updatedBy?: { name?: string }; note?: string }>;
};

const STEPS = [
  { key: 'Submitted',   label: 'Submitted',   icon: Clock },
  { key: 'Assigned',    label: 'Assigned',    icon: UserCog },
  { key: 'In Progress', label: 'In Progress', icon: Wrench },
  { key: 'Resolved',    label: 'Resolved',    icon: CheckCircle2 },
];

export default function ResidentComplaintsPage() {
  const [list, setList] = useState<Complaint[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Complaint | null>(null);

  const fetchList = async () => {
    try { const data = await api('/api/complaints/my'); setList(Array.isArray(data) ? data : []); } catch {}
  };
  useEffect(() => { fetchList(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setLoading(true);
    try {
      await api('/api/complaints', { method: 'POST', body: JSON.stringify({ title, category, description }) });
      setTitle(''); setDescription(''); setOpen(false);
      await fetchList();
    } finally { setLoading(false); }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">My Complaints</h2>
          <p className="text-sm text-muted">Report issues and track resolution.</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>File Complaint</Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<MessageSquareWarning size={22} />}
          title="No complaints filed"
          description="When you report an issue, it'll show up here with a live status timeline."
          action={<Button onClick={() => setOpen(true)} leftIcon={<Plus size={16} />}>File Complaint</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card hoverable>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="heading text-base">{c.title || c.category}</h3>
                    <div className="text-xs text-muted mt-0.5">{c.category}</div>
                  </div>
                  <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                </div>
                <p className="text-sm text-muted mt-3 line-clamp-2">{c.description}</p>
                <Timeline complaint={c} compact />
                <div className="mt-3 text-right">
                  <button className="text-xs text-brand-400 hover:text-brand-300" onClick={() => setDetail(c)}>
                    View full timeline →
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title="File a Complaint"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={submit} loading={loading} disabled={!title || !description}>Submit</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Leaking tap in kitchen" />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              <option>Plumbing</option>
              <option>Electricity</option>
              <option>Security</option>
              <option>Housekeeping</option>
              <option>Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Description</label>
            <textarea className="input min-h-[100px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail…" />
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title || detail?.category} size="md">
        {detail && <Timeline complaint={detail} />}
      </Modal>
    </Shell>
  );
}

function Timeline({ complaint, compact }: { complaint: Complaint; compact?: boolean }) {
  const tl = complaint.timeline ?? [];
  const firsts: Record<string, any> = {};
  tl.forEach(e => { if (!firsts[e.stage]) firsts[e.stage] = e; });

  const activeIdx = STEPS.findIndex(s => s.key.toLowerCase() === complaint.status.toLowerCase());
  const currentStep = activeIdx >= 0 ? activeIdx : 0;

  return (
    <div className={`mt-3 ${compact ? 'py-1' : 'py-2'}`}>
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
      {!compact && (
        <ul className="mt-4 space-y-2">
          {STEPS.map(s => {
            const entry = firsts[s.key];
            const active = !!entry;
            return (
              <li key={s.key} className={`text-sm flex items-center gap-2 ${active ? '' : 'opacity-50'}`}>
                <span className="w-28 text-xs text-muted">{s.label}</span>
                <span className="flex-1 text-xs">
                  {active ? new Date(entry.timestamp || complaint.updatedAt || complaint.createdAt!).toLocaleString() : '—'}
                  {entry?.updatedBy?.name ? ` · ${entry.updatedBy.name}` : ''}
                  {entry?.note ? ` · ${entry.note}` : ''}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
