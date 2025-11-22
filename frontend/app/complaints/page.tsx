"use client";
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';

export default function ComplaintsPage() {
  const [list, setList] = useState<any[]>([]);
  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    try { const data = await api('/api/complaints/me'); setList(data); } catch {}
  };
  useEffect(() => { fetchList(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api('/api/complaints', { method: 'POST', body: JSON.stringify({ category, description }) });
      setDescription('');
      await fetchList();
    } finally { setLoading(false); }
  };

  const steps = [
    { key: 'submitted', label: 'Submitted', icon: '🟡' },
    { key: 'assigned', label: 'Assigned', icon: '🟠' },
    { key: 'in_progress', label: 'In Progress', icon: '🔵' },
    { key: 'resolved', label: 'Resolved', icon: '🟢' },
  ] as const;

  function renderTracker(c: any) {
    const h: any[] = Array.isArray(c.history) ? c.history : [];
    const byStep: Record<string, any> = {};
    h.forEach(s => { if (!byStep[s.step]) byStep[s.step] = s; });
    return (
      <div className="mt-2 space-y-1">
        {steps.map((s, idx) => {
          const entry = byStep[s.key];
          const active = Boolean(entry);
          return (
            <div key={s.key} className={`flex items-center gap-2 text-sm ${active ? '' : 'opacity-60'}`}>
              <span>{s.icon}</span>
              <span className="w-28">{s.label}</span>
              <span className="flex-1 text-xs">
                {active ? new Date(entry.at || c.updatedAt || c.createdAt).toLocaleString() : '—'}
                {active && entry.by?.name ? ` • by ${entry.by.name}` : ''}
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
          <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={category} onChange={e=>setCategory(e.target.value)}>
            <option>Plumbing</option>
            <option>Electricity</option>
            <option>Security</option>
            <option>Housekeeping</option>
          </select>
          <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Describe the issue" value={description} onChange={e=>setDescription(e.target.value)} />
          <button className="btn-glow w-fit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
        </form>
        <div className="card p-4">
          <h3 className="font-semibold mb-3">My Complaints</h3>
          <div className="space-y-2">
            {list.map(c => (
              <div key={c._id} className="p-3 rounded bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.category}</p>
                    <p className="text-sm opacity-80">{c.description}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-white/10 capitalize">{c.status}</span>
                </div>
                {renderTracker(c)}
              </div>
            ))}
            {!list.length && <p className="opacity-70">No complaints yet.</p>}
          </div>
        </div>
      </div>
    </Shell>
  );
}

