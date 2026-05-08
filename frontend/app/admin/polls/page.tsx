"use client";
import { useEffect, useState } from 'react';
import { Plus, X, Trash2, CircleSlash, Vote } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/ui/EmptyState';
import { api } from '../../../lib/api';

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [endsAt, setEndsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchPolls = async () => { try { setPolls(await api('/api/polls')); } catch {} };
  useEffect(() => { fetchPolls(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOpts = options.filter(o => o.trim());
    if (!question.trim() || validOpts.length < 2) return;
    try {
      setSubmitting(true);
      await api('/api/polls', { method: 'POST', body: JSON.stringify({ question, options: validOpts, endsAt: endsAt || undefined }) });
      setQuestion(''); setOptions(['', '']); setEndsAt(''); setOpen(false);
      fetchPolls();
    } catch {} finally { setSubmitting(false); }
  };

  const deletePoll = async (id: string) => {
    if (!confirm('Delete this poll permanently?')) return;
    try {
      await api(`/api/polls/${id}`, { method: 'DELETE' });
      setPolls(prev => prev.filter(p => p._id !== id));
    } catch {}
  };

  const closePoll = async (id: string) => {
    try {
      const updated = await api(`/api/polls/${id}/close`, { method: 'PATCH' });
      setPolls(prev => prev.map(p => p._id === id ? updated : p));
    } catch {}
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">Manage Polls</h2>
          <p className="text-sm text-muted">Create polls and monitor turnout.</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>Create Poll</Button>
      </div>

      {polls.length === 0 ? (
        <EmptyState icon={<Vote size={22} />} title="No polls yet" description="Create the first one to gather community opinions." />
      ) : (
        <div className="grid gap-4">
          {polls.map(poll => {
            const total = poll.options.reduce((s: number, o: any) => s + o.voters.length, 0);
            const closed = !poll.active;
            return (
              <Card key={poll._id}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="heading text-lg">{poll.question}</h3>
                    <div className="text-xs text-muted mt-0.5">
                      {total} vote{total !== 1 ? 's' : ''}
                      {poll.endsAt ? ` · Ends ${new Date(poll.endsAt).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={closed ? 'slate' : 'emerald'}>{closed ? 'Closed' : 'Active'}</Badge>
                    {!closed && (
                      <Button size="sm" variant="ghost" leftIcon={<CircleSlash size={13} />} onClick={() => closePoll(poll._id)}>Close</Button>
                    )}
                    <button
                      onClick={() => deletePoll(poll._id)}
                      className="p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {poll.options.map((opt: any) => {
                    const pct = total ? Math.round((opt.voters.length / total) * 100) : 0;
                    return (
                      <div key={opt._id} className="relative rounded-xl border border-[var(--border)] bg-[var(--card-muted)] overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-white/5 transition-all duration-700" style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm font-medium">{opt.text}</span>
                          <span className="text-xs text-muted"><span className="font-semibold text-[var(--text)]">{pct}%</span> · {opt.voters.length}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open} onClose={() => !submitting && setOpen(false)} title="Create Poll"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} loading={submitting} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}>Create</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <Input label="Question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Should we upgrade the gym?" />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}
                    className="p-2 rounded-lg border border-[var(--border)] hover:bg-white/5"
                  ><X size={14} /></button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setOptions(prev => [...prev, ''])}
              className="text-sm text-brand-400 hover:text-brand-300"
            >+ Add option</button>
          </div>
          <Input label="Ends At (optional)" type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
        </form>
      </Modal>
    </Shell>
  );
}
