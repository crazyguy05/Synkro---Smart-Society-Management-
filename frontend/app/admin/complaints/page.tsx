"use client";
import { useEffect, useMemo, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';

type Complaint = {
  _id: string;
  category: string;
  description: string;
  status: 'pending'|'in_progress'|'resolved';
  resident?: { name?: string; email?: string; apartment?: string };
  assignedTo?: { _id: string; name?: string } | null;
  history?: Array<{ step: 'submitted'|'assigned'|'in_progress'|'resolved'; at?: string; by?: { name?: string } | string }>;
  createdAt?: string;
};

export default function AdminComplaintsPage() {
  const [list, setList] = useState<Complaint[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState('');
  const [timelineOpen, setTimelineOpen] = useState<Complaint | null>(null);

  async function fetchComplaints() {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await api(`/api/complaints${query}`);
    setList(Array.isArray(data) ? data : []);
  }
  async function fetchStaff() {
    try {
      const users = await api('/api/auth/users?role=staff');
      setStaff(Array.isArray(users) ? users : []);
    } catch {}
  }
  useEffect(() => { fetchComplaints(); }, [filterStatus, category]);
  useEffect(() => { fetchStaff(); }, []);

  const steps = [
    { key: 'submitted', label: 'Submitted', icon: '🟡' },
    { key: 'assigned', label: 'Assigned', icon: '🟠' },
    { key: 'in_progress', label: 'In Progress', icon: '🔵' },
    { key: 'resolved', label: 'Resolved', icon: '🟢' },
  ] as const;

  function renderTracker(c: Complaint) {
    const h = Array.isArray(c.history) ? c.history : [];
    const byStep: Record<string, any> = {};
    h.forEach(s => { if (!byStep[s.step]) byStep[s.step] = s; });
    return (
      <div className="mt-2 space-y-1">
        {steps.map(s => {
          const entry = byStep[s.key as string];
          const active = Boolean(entry);
          return (
            <div key={s.key} className={`flex items-center gap-2 text-sm ${active ? '' : 'opacity-60'}`}>
              <span>{s.icon}</span>
              <span className="w-28">{s.label}</span>
              <span className="flex-1 text-xs">
                {active ? new Date((entry?.at as string) || '').toLocaleString() : '—'}
                {active && (entry?.by as any)?.name ? ` • by ${(entry?.by as any).name}` : ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  async function setAssign(id: string, assignedTo: string) {
    try { await api(`/api/complaints/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedTo }) }); await fetchComplaints(); } catch {}
  }
  async function updateStatusRemote(id: string, status: Complaint['status']) {
    try { await api(`/api/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await fetchComplaints(); } catch {}
  }
  async function deleteComplaint(id: string) {
    if (!confirm('Delete this complaint?')) return;
    try {
      await api(`/api/complaints/${id}`, { method: 'DELETE' });
      setBanner('🗑️ Complaint deleted successfully');
      setTimeout(()=>setBanner(''), 2000);
      await fetchComplaints();
    } catch {}
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(c => `${c.category} ${c.description} ${c.resident?.name || ''}`.toLowerCase().includes(term));
  }, [list, q]);

  return (
    <Shell>
      <div className="grid gap-4">
        {banner && <div className="p-2 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">{banner}</div>}
        <div className="flex items-center gap-2 flex-wrap">
          <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option>Plumbing</option>
            <option>Electricity</option>
            <option>Security</option>
            <option>Housekeeping</option>
          </select>
          <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="px-3 py-2 rounded border border-white/10 bg-white/5" onClick={fetchComplaints}>Refresh</button>
        </div>

        <div className="grid gap-2">
          {filtered.map(c => (
            <div key={c._id} className="p-3 rounded border border-white/10 bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{c.category} <span className="opacity-60 text-sm">• {c.resident?.name || 'Resident'} {c.resident?.apartment ? `(${c.resident.apartment})` : ''}</span></div>
                  {c as any && (c as any).title && <div className="text-sm">Title: {(c as any).title}</div>}
                  {c as any && (c as any).flatNumber && <div className="text-xs opacity-70">Flat: {(c as any).flatNumber}</div>}
                  <div className="text-sm opacity-80">{c.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select className="px-2 py-1 rounded bg-white/5 border border-white/10" value={c.assignedTo?._id || ''} onChange={e=>setAssign(c._id, e.target.value)}>
                    <option value="">Unassigned</option>
                    {staff.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
                  </select>
                  <select className="px-2 py-1 rounded bg-white/5 border border-white/10" value={c.status} onChange={e=>updateStatusRemote(c._id, e.target.value as Complaint['status'])}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={()=>setTimelineOpen(c)}>View Timeline</button>
                  <button className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20" onClick={()=>deleteComplaint(c._id)}>🗑️</button>
                </div>
              </div>
              {renderTracker(c)}
            </div>
          ))}
          {!filtered.length && <div className="opacity-70">No complaints found.</div>}
        </div>

        {timelineOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 w-full max-w-lg max-h-[75vh] overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Complaint Timeline</h3>
                <button onClick={()=>setTimelineOpen(null)} className="px-2 py-1 rounded bg-white/10">Close</button>
              </div>
              {renderTracker(timelineOpen)}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
