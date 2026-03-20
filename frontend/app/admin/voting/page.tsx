"use client";
import { useEffect, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

type Poll = {
  _id: string;
  title: string;
  description?: string;
  options: { text: string; votes: number }[];
  deadline: string;
  status: 'open' | 'closed';
  isAnonymous: boolean;
};

export default function AdminVotingPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPollId, setSelectedPollId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    options: ['Option 1', 'Option 2'],
    deadline: '',
    isAnonymous: true,
  });

  const loadPolls = async () => {
    try {
      const list = await api('/api/voting');
      const items = Array.isArray(list) ? list : [];
      setPolls(items);
      if (!selectedPollId && items.length) setSelectedPollId(items[0]._id);
    } catch {
      setPolls([]);
    }
  };

  const loadStats = async (id: string) => {
    try {
      const [res, chain] = await Promise.all([api(`/api/voting/${id}/results`), api(`/api/voting/${id}/logs`)]);
      setResults(res);
      setLogs(Array.isArray(chain) ? chain : []);
    } catch {}
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadPolls();
  }, [user]);

  useEffect(() => {
    if (selectedPollId) loadStats(selectedPollId);
  }, [selectedPollId]);

  const createPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const options = form.options.map((x) => x.trim()).filter(Boolean);
    if (!form.title.trim()) {
      setMessage('Please enter what residents are voting for.');
      return;
    }
    if (options.length < 2) {
      setMessage('Please keep at least 2 options/candidates.');
      return;
    }
    try {
      await api('/api/voting', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description,
          options,
          deadline: form.deadline,
          isAnonymous: form.isAnonymous,
        }),
      });
      setMessage('Poll created successfully.');
      setForm((v) => ({ ...v, title: '', description: '', deadline: '', options: ['Option 1', 'Option 2'] }));
      await loadPolls();
    } catch (e: any) {
      setMessage(e?.message || 'Failed to create poll');
    }
  };

  const updateOption = (idx: number, value: string) => {
    setForm((v) => ({
      ...v,
      options: v.options.map((o, i) => (i === idx ? value : o)),
    }));
  };

  const addOption = () => {
    setForm((v) => ({ ...v, options: [...v.options, `Option ${v.options.length + 1}`] }));
  };

  const removeOption = (idx: number) => {
    setForm((v) => ({
      ...v,
      options: v.options.filter((_, i) => i !== idx),
    }));
  };

  const sendReminders = async () => {
    if (!selectedPollId) return;
    try {
      const r = await api(`/api/voting/${selectedPollId}/remind`, { method: 'POST' });
      setMessage(`${r.message}. Pending households: ${r.pendingHouseholds}`);
    } catch (e: any) {
      setMessage(e?.message || 'Failed to prepare reminders');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Shell>
        <div className="p-6">Only admins can access voting management.</div>
      </Shell>
    );
  }

  const integrityOk = logs.length ? logs.every((l) => l.valid) : true;

  return (
    <Shell>
      <div className="grid gap-4">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">Voting Management (Admin)</h2>
          <p className="text-sm opacity-75">Create polls, monitor participation trends, and inspect blockchain-style vote logs.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <form onSubmit={createPoll} className="card p-4 grid gap-2 lg:col-span-1">
            <h3 className="font-medium">Create & Post Voting</h3>
            <p className="text-xs opacity-70">Step 1: Enter poll topic. Step 2: Add/edit candidates/options. Step 3: Post voting.</p>
            <input
              className="px-3 py-2 rounded bg-white/5 border border-white/10"
              placeholder="Poll Topic (what is this voting for?)"
              value={form.title}
              onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
            />
            <textarea
              className="px-3 py-2 rounded bg-white/5 border border-white/10 min-h-[72px]"
              placeholder="Description / context for residents"
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
            />
            <div className="space-y-2">
              <p className="text-sm opacity-80">Options / Candidates</p>
              {form.options.map((opt, idx) => (
                <div key={`opt-${idx}`} className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40"
                    onClick={() => removeOption(idx)}
                    disabled={form.options.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="px-3 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={addOption}>
                + Add Option
              </button>
            </div>
            <input type="datetime-local" className="px-3 py-2 rounded bg-white/5 border border-white/10" value={form.deadline} onChange={(e) => setForm((v) => ({ ...v, deadline: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm((v) => ({ ...v, isAnonymous: e.target.checked }))} className="accent-orange-500" />
              Anonymous voting
            </label>
            <button className="btn-glow w-fit px-3 py-2 rounded">Post Voting</button>
          </form>

          <div className="card p-4 lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={selectedPollId} onChange={(e) => setSelectedPollId(e.target.value)}>
                <option value="">Select Poll</option>
                {polls.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <button type="button" className="px-3 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={sendReminders} disabled={!selectedPollId}>
                Send Reminders
              </button>
            </div>

            {results && (
              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded border border-white/10 p-3 bg-white/5">
                  <p className="text-xs opacity-70">Total Votes</p>
                  <p className="text-2xl font-semibold">{results.totalVotes}</p>
                </div>
                <div className="rounded border border-white/10 p-3 bg-white/5">
                  <p className="text-xs opacity-70">Participation</p>
                  <p className="text-2xl font-semibold">{results.participationPct}%</p>
                </div>
                <div className="rounded border border-white/10 p-3 bg-white/5">
                  <p className="text-xs opacity-70">Trust Log Integrity</p>
                  <p className={`text-lg font-semibold ${integrityOk ? 'text-emerald-300' : 'text-red-300'}`}>{integrityOk ? 'Valid' : 'Issue found'}</p>
                </div>
              </div>
            )}

            {results?.options?.map((o: any) => (
              <div key={o.text} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{o.text}</span>
                  <span>
                    {o.votes} votes ({o.pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500" style={{ width: `${Math.max(5, o.pct)}%` }} />
                </div>
              </div>
            ))}

            <div className="rounded border border-white/10 p-3 bg-white/5">
              <h4 className="font-medium text-sm mb-2">Vote Log Chain (latest 10)</h4>
              <div className="space-y-1 text-xs max-h-48 overflow-auto">
                {logs.slice(-10).map((l) => (
                  <div key={l.id} className="flex justify-between gap-2">
                    <span className="truncate">{l.hash?.slice(0, 14)}... ({l.valid ? 'ok' : 'bad'})</span>
                    <span className="opacity-70">{new Date(l.createdAt).toLocaleString()}</span>
                  </div>
                ))}
                {logs.length === 0 && <p className="opacity-70">No logs yet.</p>}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="card p-3">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </Shell>
  );
}

