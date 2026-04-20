"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar, Plus, MapPin, Clock, Users, Vote, X, ArrowRight, CircleSlash,
} from 'lucide-react';
import Shell from '../../components/Shell';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

type Motion = {
  _id?: string; title: string; description?: string;
  voteCounts?: { yes: number; no: number; abstain: number };
  myVote?: 'yes' | 'no' | 'abstain' | null;
  closed?: boolean;
};

type Meeting = {
  _id: string; title: string; agenda?: string; location?: string;
  scheduledAt: string; durationMins?: number;
  host?: { name?: string; email?: string };
  rsvpCounts: { going: number; maybe: number; declined: number };
  myRsvp: 'going' | 'maybe' | 'declined' | null;
  motions: Motion[];
  status: 'Scheduled' | 'Live' | 'Ended' | 'Cancelled';
};

export default function MeetingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [list, setList] = useState<Meeting[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', agenda: '', location: '', scheduledAt: '', durationMins: '60',
    motions: [''] as string[],
  });

  const fetchList = async () => {
    try { setList(await api('/api/meetings')); } catch {}
  };
  useEffect(() => { fetchList(); }, []);

  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) return;
    setSubmitting(true);
    try {
      await api('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          agenda: form.agenda,
          location: form.location,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMins: Number(form.durationMins) || 60,
          motions: form.motions.filter(m => m.trim()).map(title => ({ title })),
        }),
      });
      setForm({ title: '', agenda: '', location: '', scheduledAt: '', durationMins: '60', motions: [''] });
      setOpen(false);
      fetchList();
    } finally { setSubmitting(false); }
  };

  const upcoming = list.filter(m => m.status === 'Scheduled' || m.status === 'Live');
  const past     = list.filter(m => m.status === 'Ended' || m.status === 'Cancelled');

  return (
    <Shell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="heading text-2xl">Society Meetings</h2>
          <p className="text-sm text-muted">Upcoming meetings, agendas and live voting on motions.</p>
        </div>
        {isAdmin && <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>Schedule Meeting</Button>}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Calendar size={22} />}
          title="No meetings yet"
          description={isAdmin ? 'Schedule the first meeting to get things rolling.' : 'Your society hasn\'t scheduled any meetings.'}
          action={isAdmin ? <Button onClick={() => setOpen(true)} leftIcon={<Plus size={16} />}>Schedule Meeting</Button> : undefined}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h3 className="heading text-base mb-3 text-muted">Upcoming</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {upcoming.map((m, i) => (
                  <motion.div key={m._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <MeetingCard m={m} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h3 className="heading text-base mb-3 text-muted">Past</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {past.map(m => <MeetingCard key={m._id} m={m} />)}
              </div>
            </section>
          )}
        </>
      )}

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Schedule Meeting"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={createMeeting} loading={submitting} disabled={!form.title || !form.scheduledAt}>Create</Button>
          </>
        }
      >
        <form onSubmit={createMeeting} className="space-y-3">
          <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="AGM Q2 review" />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Agenda</label>
            <textarea className="input min-h-[90px]" value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} placeholder="Topics, decisions to take…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date & Time" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            <Input label="Duration (mins)" type="number" value={form.durationMins} onChange={e => setForm(f => ({ ...f, durationMins: e.target.value }))} />
          </div>
          <Input label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Clubhouse / Zoom link" />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted">Motions for vote (optional)</label>
            {form.motions.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={`Motion ${i + 1}`}
                  value={m}
                  onChange={e => setForm(f => ({ ...f, motions: f.motions.map((x, j) => j === i ? e.target.value : x) }))}
                />
                {form.motions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, motions: f.motions.filter((_, j) => j !== i) }))}
                    className="p-2 rounded-lg border border-[var(--border)] hover:bg-white/5"
                  ><X size={14} /></button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, motions: [...f.motions, ''] }))}
              className="text-sm text-brand-400 hover:text-brand-300"
            >+ Add motion</button>
          </div>
        </form>
      </Modal>
    </Shell>
  );
}

function MeetingCard({ m }: { m: Meeting }) {
  const date = new Date(m.scheduledAt);
  const statusTone = m.status === 'Live' ? 'emerald' : m.status === 'Scheduled' ? 'brand' : m.status === 'Cancelled' ? 'rose' : 'slate';

  return (
    <Card hoverable className="relative overflow-hidden">
      {m.status === 'Live' && <span className="absolute top-3 right-3 inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="heading text-base">{m.title}</h3>
          {m.host?.name && <div className="text-xs text-muted mt-0.5">Hosted by {m.host.name}</div>}
        </div>
        <Badge tone={statusTone as any}>{m.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-muted">
        <div className="inline-flex items-center gap-1.5"><Calendar size={12} />{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        <div className="inline-flex items-center gap-1.5"><Clock size={12} />{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {m.durationMins ?? 60}m</div>
        {m.location && <div className="inline-flex items-center gap-1.5 col-span-2 truncate"><MapPin size={12} />{m.location}</div>}
      </div>

      {m.agenda && <p className="text-sm text-muted line-clamp-2 mb-3">{m.agenda}</p>}

      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span className="inline-flex items-center gap-1.5"><Users size={12} />{m.rsvpCounts.going} going · {m.rsvpCounts.maybe} maybe</span>
        {m.motions.length > 0 && <span className="inline-flex items-center gap-1.5"><Vote size={12} />{m.motions.length} motion{m.motions.length !== 1 ? 's' : ''}</span>}
      </div>

      <Link href={`/meetings/${m._id}`}>
        <Button size="sm" className="w-full" rightIcon={<ArrowRight size={14} />}>View & Vote</Button>
      </Link>
    </Card>
  );
}
