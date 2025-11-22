"use client";
import { useEffect, useMemo, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';

export default function ResidentComplaintsPage() {
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState<any | null>(null);

  async function fetchList() {
    try { const data = await api('/api/complaints/my'); setList(Array.isArray(data) ? data : []); } catch {}
  }
  useEffect(() => { fetchList(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!title || !category || !description) return; setLoading(true);
    try {
      await api('/api/complaints', { method: 'POST', body: JSON.stringify({ title, category, description }) });
      setTitle(''); setDescription('');
      await fetchList();
    } finally { setLoading(false); }
  }

  const steps = [
    { key: 'Submitted', label: 'Submitted', icon: '🟡' },
    { key: 'Assigned', label: 'Assigned', icon: '🟠' },
    { key: 'In Progress', label: 'In Progress', icon: '🔵' },
    { key: 'Resolved', label: 'Resolved', icon: '🟢' },
  ] as const;

  function renderTimeline(c: any) {
    const tl: any[] = Array.isArray(c.timeline) ? c.timeline : [];
    const firsts: Record<string, any> = {};
    tl.forEach(entry => { if (!firsts[entry.stage]) firsts[entry.stage] = entry; });
    return (
      <div className="mt-2 space-y-1">
        {steps.map(s => {
          const entry = firsts[s.key];
          const active = Boolean(entry);
          return (
            <div key={s.key} className={`flex items-center gap-2 text-sm ${active ? '' : 'opacity-60'}`}>
              <span>{s.icon}</span>
              <span className="w-28">{s.label}</span>
              <span className="flex-1 text-xs">
                {active ? new Date(entry.timestamp || c.updatedAt || c.createdAt).toLocaleString() : '—'}
                {active && entry.updatedBy?.name ? ` • by ${entry.updatedBy.name}` : ''}
                {active && entry.note ? ` • ${entry.note}` : ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Shell>
      <div className="grid gap-4">
        <form onSubmit={submit} className="card p-4 grid gap-2">
          <h2 className="font-semibold">File a Complaint</h2>
          <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={category} onChange={e=>setCategory(e.target.value)}>
            <option>Plumbing</option>
            <option>Electricity</option>
            <option>Security</option>
            <option>Housekeeping</option>
          </select>
          <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Describe the issue" value={description} onChange={e=>setDescription(e.target.value)} />
          <button className="btn-glow w-fit" disabled={loading || !title || !description}>{loading ? 'Submitting...' : 'Submit'}</button>
        </form>

        <div className="card p-4">
          <h3 className="font-semibold mb-3">My Complaints</h3>
          <div className="space-y-2">
            {list.map(c => (
              <div key={c._id} className="p-3 rounded bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.title || c.category}</p>
                    <p className="text-sm opacity-80">{c.description}</p>
                    {c.flatNumber && <p className="text-xs opacity-70">Flat: {c.flatNumber}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-white/10">{c.status}</span>
                    <button className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={()=>setTimelineOpen(c)}>View Timeline</button>
                  </div>
                </div>
                {renderTimeline(c)}
              </div>
            ))}
            {!list.length && <p className="opacity-70">No complaints yet.</p>}
          </div>
        </div>

        {timelineOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 w-full max-w-lg max-h-[75vh] overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Complaint Timeline</h3>
                <button onClick={()=>setTimelineOpen(null)} className="px-2 py-1 rounded bg-white/10">Close</button>
              </div>
              {renderTimeline(timelineOpen)}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
