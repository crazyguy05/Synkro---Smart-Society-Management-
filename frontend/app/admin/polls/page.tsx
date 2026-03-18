"use client";
import { useEffect, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [endsAt, setEndsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPolls = async () => { try { setPolls(await api('/api/polls')); } catch {} };
  useEffect(() => { fetchPolls(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOpts = options.filter(o => o.trim());
    if (!question.trim() || validOpts.length < 2) return;
    try {
      setSubmitting(true);
      await api('/api/polls', {
        method: 'POST',
        body: JSON.stringify({ question, options: validOpts, endsAt: endsAt || undefined })
      });
      setQuestion(''); setOptions(['', '']); setEndsAt('');
      fetchPolls();
    } catch {}
    finally { setSubmitting(false); }
  };

  const deletePoll = async (id: string) => {
    if (!window.confirm('Delete this poll permanently?')) return;
    try {
      await api(`/api/polls/${id}`, { method: 'DELETE' });
      setPolls(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      alert('Failed to delete poll. Please try again.');
    }
  };

  const closePoll = async (id: string) => {
    try {
      const updated = await api(`/api/polls/${id}/close`, { method: 'PATCH' });
      setPolls(prev => prev.map(p => p._id === id ? updated : p));
    } catch {}
  };

  return (
    <Shell>
      <div className="grid gap-6">
        <h2 className="text-lg font-semibold">Manage Polls</h2>

        <div className="card p-4 border border-white/10 bg-white/5 rounded-xl">
          <h3 className="font-medium mb-3">Create Poll</h3>
          <form onSubmit={submit} className="grid gap-3">
            <input
              className="px-3 py-2 rounded bg-white/5 border border-white/10"
              placeholder="Question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="px-2 py-1 rounded border border-white/10 bg-white/5 text-sm"
                    onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}
                  >✕</button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="text-sm text-blue-400 text-left"
              onClick={() => setOptions(prev => [...prev, ''])}
            >+ Add option</button>
            <input
              type="date"
              className="px-3 py-2 rounded bg-white/5 border border-white/10 text-sm"
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              title="End date (optional)"
            />
            <button className="btn-glow px-3 py-2 rounded" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Poll'}
            </button>
          </form>
        </div>

        <div className="grid gap-3">
          {polls.map(poll => {
            const total = poll.options.reduce((s: number, o: any) => s + o.voters.length, 0);
            return (
              <div key={poll._id} className="card p-4 border border-white/10 bg-white/5 rounded-xl grid gap-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{poll.question}</p>
                    <p className="text-xs opacity-50">{total} votes · {poll.active ? 'Active' : 'Closed'}</p>
                  </div>
                  <div className="flex gap-2">
                  {poll.active && (
                    <button
                      className="text-sm px-3 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => closePoll(poll._id)}
                    >Close</button>
                  )}
                  <button
                    className="text-sm px-3 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => deletePoll(poll._id)}
                  >Delete</button>
                  </div>
                </div>
                <div className="grid gap-1">
                  {poll.options.map((opt: any) => {
                    const pct = total ? Math.round((opt.voters.length / total) * 100) : 0;
                    return (
                      <div key={opt._id} className="grid gap-0.5">
                        <div className="flex justify-between text-xs opacity-70">
                          <span>{opt.text}</span>
                          <span>{opt.voters.length} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!polls.length && <p className="opacity-70">No polls yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
