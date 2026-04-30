"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Users, ArrowLeft, Check, X as XIcon, Minus,
  ThumbsUp, ThumbsDown, Hand, Plus, CircleSlash, Trash2, Play, Square,
  Video, VideoOff,
} from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import JitsiRoom from '../../../components/JitsiRoom';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

type Motion = {
  _id: string; title: string; description?: string;
  voteCounts: { yes: number; no: number; abstain: number };
  myVote: 'yes' | 'no' | 'abstain' | null;
  closed: boolean;
};
type Meeting = {
  _id: string; title: string; agenda?: string; location?: string;
  scheduledAt: string; durationMins?: number;
  host?: { _id?: string; name?: string; email?: string };
  rsvpCounts: { going: number; maybe: number; declined: number };
  myRsvp: 'going' | 'maybe' | 'declined' | null;
  motions: Motion[];
  status: 'Scheduled' | 'Live' | 'Ended' | 'Cancelled';
};

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [m, setM] = useState<Meeting | null>(null);
  const [addMotionOpen, setAddMotionOpen] = useState(false);
  const [newMotion, setNewMotion] = useState({ title: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const fetchOne = async () => {
    try { setM(await api(`/api/meetings/${id}`)); } catch {}
  };
  useEffect(() => { if (id) fetchOne(); }, [id]);

  if (!m) {
    return (
      <Shell>
        <div className="h-64 grid place-items-center text-muted">Loading…</div>
      </Shell>
    );
  }

  const date = new Date(m.scheduledAt);
  const rsvp = async (choice: 'going' | 'maybe' | 'declined') => {
    try { setM(await api(`/api/meetings/${m._id}/rsvp`, { method: 'POST', body: JSON.stringify({ rsvp: choice }) })); } catch {}
  };
  const voteMotion = async (motionId: string, vote: 'yes' | 'no' | 'abstain') => {
    try { setM(await api(`/api/meetings/${m._id}/motions/${motionId}/vote`, { method: 'POST', body: JSON.stringify({ vote }) })); } catch {}
  };
  const closeMotion = async (motionId: string) => {
    try { setM(await api(`/api/meetings/${m._id}/motions/${motionId}/close`, { method: 'PATCH' })); } catch {}
  };
  const addMotion = async () => {
    if (!newMotion.title.trim()) return;
    setBusy(true);
    try {
      setM(await api(`/api/meetings/${m._id}/motions`, { method: 'POST', body: JSON.stringify(newMotion) }));
      setNewMotion({ title: '', description: '' });
      setAddMotionOpen(false);
    } finally { setBusy(false); }
  };
  const setStatus = async (status: Meeting['status']) => {
    try { setM(await api(`/api/meetings/${m._id}`, { method: 'PATCH', body: JSON.stringify({ status }) })); } catch {}
  };
  const deleteMeeting = async () => {
    if (!confirm('Delete this meeting?')) return;
    try { await api(`/api/meetings/${m._id}`, { method: 'DELETE' }); router.push('/meetings'); } catch {}
  };

  const statusTone = m.status === 'Live' ? 'emerald' : m.status === 'Scheduled' ? 'brand' : m.status === 'Cancelled' ? 'rose' : 'slate';

  return (
    <Shell>
      <button
        onClick={() => router.push('/meetings')}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-[var(--text)] -mt-2"
      >
        <ArrowLeft size={14} /> All meetings
      </button>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-aurora opacity-30 animate-gradient [background-size:200%_200%]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge tone={statusTone as any}>{m.status}</Badge>
                {m.host?.name && <span className="text-xs text-muted">Hosted by {m.host.name}</span>}
              </div>
              <h2 className="heading text-2xl">{m.title}</h2>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                {m.status === 'Scheduled' && <Button size="sm" variant="ghost" leftIcon={<Play size={13} />} onClick={() => setStatus('Live')}>Start</Button>}
                {m.status === 'Live' && <Button size="sm" variant="ghost" leftIcon={<Square size={13} />} onClick={() => setStatus('Ended')}>End</Button>}
                {(m.status === 'Scheduled' || m.status === 'Live') && (
                  <Button size="sm" variant="ghost" leftIcon={<CircleSlash size={13} />} onClick={() => setStatus('Cancelled')}>Cancel</Button>
                )}
                <button onClick={deleteMeeting} className="p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
            <InfoRow icon={<Calendar size={15} />} label="Date" value={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} />
            <InfoRow icon={<Clock size={15} />} label="Time" value={`${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · ${m.durationMins ?? 60}m`} />
            <InfoRow icon={<MapPin size={15} />} label="Location" value={m.location || '—'} />
          </div>

          {m.agenda && (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-muted mb-1">Agenda</div>
              <p className="text-sm whitespace-pre-wrap">{m.agenda}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Video room */}
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="heading text-base flex items-center gap-2"><Video size={16} /> Video Room</h3>
            <p className="text-sm text-muted mt-1">
              {videoOpen
                ? 'Live now — share this meeting link with attendees.'
                : 'Join this meeting as a video call. Powered by meet.jit.si.'}
            </p>
          </div>
          {videoOpen ? (
            <Button variant="danger" size="sm" leftIcon={<VideoOff size={14} />} onClick={() => setVideoOpen(false)}>
              Leave Room
            </Button>
          ) : (
            <Button size="sm" leftIcon={<Video size={14} />} onClick={() => setVideoOpen(true)}>
              Join Video Room
            </Button>
          )}
        </div>

        {videoOpen && (
          <div className="mt-4">
            <JitsiRoom
              roomId={`Meeting_${m._id}`}
              displayName={user?.name}
              email={user?.email}
              onLeave={() => setVideoOpen(false)}
              height="540px"
            />
          </div>
        )}
      </Card>

      {/* RSVP */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="heading text-base flex items-center gap-2"><Users size={16} /> RSVPs</h3>
          <div className="text-xs text-muted">
            {m.rsvpCounts.going} going · {m.rsvpCounts.maybe} maybe · {m.rsvpCounts.declined} declined
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <RsvpButton icon={<Check size={14} />}   label="Going"    active={m.myRsvp === 'going'}    onClick={() => rsvp('going')} />
          <RsvpButton icon={<Minus size={14} />}   label="Maybe"    active={m.myRsvp === 'maybe'}    onClick={() => rsvp('maybe')} />
          <RsvpButton icon={<XIcon size={14} />}   label="Decline"  active={m.myRsvp === 'declined'} onClick={() => rsvp('declined')} />
        </div>
      </Card>

      {/* Motions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="heading text-lg">Motions & Voting</h3>
          {isAdmin && m.status !== 'Ended' && m.status !== 'Cancelled' && (
            <Button size="sm" variant="ghost" leftIcon={<Plus size={14} />} onClick={() => setAddMotionOpen(true)}>Add Motion</Button>
          )}
        </div>
        {m.motions.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">No motions to vote on yet.</div>
        ) : (
          <div className="grid gap-3">
            {m.motions.map((mo, i) => (
              <motion.div key={mo._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <MotionCard motion={mo} onVote={voteMotion} onClose={closeMotion} isAdmin={isAdmin} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={addMotionOpen} onClose={() => !busy && setAddMotionOpen(false)} title="Add Motion"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddMotionOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={addMotion} loading={busy} disabled={!newMotion.title.trim()}>Add</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Motion" value={newMotion.title} onChange={e => setNewMotion(n => ({ ...n, title: e.target.value }))} placeholder="Increase maintenance rate by 5%" />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Description (optional)</label>
            <textarea className="input min-h-[80px]" value={newMotion.description} onChange={e => setNewMotion(n => ({ ...n, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </Shell>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card-muted)] border border-[var(--border)]">
      <span className="text-brand-400">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function RsvpButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition ${
        active
          ? 'border-brand-500/50 bg-gradient-to-br from-brand-500/20 to-accent-violet/20 text-brand-400 shadow-glow'
          : 'border-[var(--border)] bg-[var(--card-muted)] hover:border-brand-500/30'
      }`}
    >
      {icon}<span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function MotionCard({
  motion,
  onVote,
  onClose,
  isAdmin,
}: {
  motion: Motion;
  onVote: (id: string, v: 'yes' | 'no' | 'abstain') => void;
  onClose: (id: string) => void;
  isAdmin: boolean;
}) {
  const total = motion.voteCounts.yes + motion.voteCounts.no + motion.voteCounts.abstain;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className="heading text-base">{motion.title}</h4>
          {motion.description && <p className="text-sm text-muted mt-1">{motion.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={motion.closed ? 'slate' : 'emerald'}>{motion.closed ? 'Closed' : 'Open'}</Badge>
          {isAdmin && !motion.closed && (
            <Button size="sm" variant="ghost" onClick={() => onClose(motion._id)}>Close</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <VoteButton
          icon={<ThumbsUp size={14} />} label="Yes" tone="emerald"
          active={motion.myVote === 'yes'} disabled={motion.closed}
          onClick={() => onVote(motion._id, 'yes')}
        />
        <VoteButton
          icon={<ThumbsDown size={14} />} label="No" tone="rose"
          active={motion.myVote === 'no'} disabled={motion.closed}
          onClick={() => onVote(motion._id, 'no')}
        />
        <VoteButton
          icon={<Hand size={14} />} label="Abstain" tone="amber"
          active={motion.myVote === 'abstain'} disabled={motion.closed}
          onClick={() => onVote(motion._id, 'abstain')}
        />
      </div>

      <div className="space-y-1.5">
        <ResultBar label="Yes"     count={motion.voteCounts.yes}     pct={pct(motion.voteCounts.yes)}     tone="emerald" />
        <ResultBar label="No"      count={motion.voteCounts.no}      pct={pct(motion.voteCounts.no)}      tone="rose" />
        <ResultBar label="Abstain" count={motion.voteCounts.abstain} pct={pct(motion.voteCounts.abstain)} tone="amber" />
      </div>
      <div className="mt-2 text-xs text-muted">{total} vote{total !== 1 ? 's' : ''}</div>
    </Card>
  );
}

function VoteButton({
  icon, label, tone, active, disabled, onClick,
}: {
  icon: React.ReactNode; label: string;
  tone: 'emerald' | 'rose' | 'amber';
  active: boolean; disabled?: boolean; onClick: () => void;
}) {
  const activeCls: Record<string, string> = {
    emerald: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400',
    rose:    'border-rose-500/50 bg-rose-500/15 text-rose-400',
    amber:   'border-amber-500/50 bg-amber-500/15 text-amber-400',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition
        ${active ? activeCls[tone] + ' shadow-glow' : 'border-[var(--border)] bg-[var(--card-muted)] hover:border-brand-500/30'}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {icon}<span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function ResultBar({ label, count, pct, tone }: { label: string; count: number; pct: number; tone: 'emerald' | 'rose' | 'amber' }) {
  const barCls: Record<string, string> = {
    emerald: 'bg-emerald-500/40',
    rose:    'bg-rose-500/40',
    amber:   'bg-amber-500/40',
  };
  return (
    <div className="relative rounded-lg bg-[var(--card-muted)] border border-[var(--border)] overflow-hidden">
      <div className={`absolute inset-y-0 left-0 ${barCls[tone]} transition-all duration-500`} style={{ width: `${pct}%` }} />
      <div className="relative flex items-center justify-between px-3 py-1.5 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted"><span className="text-[var(--text)] font-semibold">{pct}%</span> · {count}</span>
      </div>
    </div>
  );
}
