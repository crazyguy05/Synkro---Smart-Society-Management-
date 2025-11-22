"use client";
import { useEffect, useMemo, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

function badge(status: string) {
  return status === 'approved'
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : status === 'rejected'
    ? 'bg-red-500/20 text-red-300 border-red-500/30'
    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
}

export default function AdminVisitorsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [query, setQuery] = useState(''); // flat/email/name search
  const [status, setStatus] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchList();
    const id = setInterval(fetchList, 10000);
    return () => clearInterval(id);
  }, [user]);

  async function fetchList() {
    try {
      const data = await api('/api/visitors');
      setList(Array.isArray(data) ? data : []);
    } catch {}
  }

  const filtered = useMemo(() => {
    return list.filter(v => {
      if (status && v.status !== status) return false;
      if (query) {
        const q = query.toLowerCase();
        const str = `${v.name} ${v.flatNumber || ''} ${v.residentEmail || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      if (from) {
        const d = new Date(v.createdAt).getTime();
        if (d < new Date(from).getTime()) return false;
      }
      if (to) {
        const d = new Date(v.createdAt).getTime();
        if (d > new Date(to).getTime() + 24*60*60*1000 - 1) return false;
      }
      return true;
    });
  }, [list, status, query, from, to]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter(v => v.status === 'pending').length;
    const approved = filtered.filter(v => v.status === 'approved').length;
    const rejected = filtered.filter(v => v.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [filtered]);

  if (user?.role !== 'admin') {
    return (
      <Shell>
        <div className="p-6">Only admins can access this page.</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Total</div><div className="text-2xl font-semibold">{stats.total}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Pending</div><div className="text-2xl font-semibold">{stats.pending}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Approved</div><div className="text-2xl font-semibold">{stats.approved}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Rejected</div><div className="text-2xl font-semibold">{stats.rejected}</div></div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Search name / flat / email" value={query} onChange={e=>setQuery(e.target.value)} />
            <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <input type="date" className="px-3 py-2 rounded bg-white/5 border border-white/10" value={from} onChange={e=>setFrom(e.target.value)} />
            <input type="date" className="px-3 py-2 rounded bg-white/5 border border-white/10" value={to} onChange={e=>setTo(e.target.value)} />
          </div>
          <button className="px-3 py-2 rounded border border-white/10 bg-white/5" onClick={fetchList}>Refresh</button>
        </div>

        <div className="overflow-auto rounded border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-3">Photo</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Purpose</th>
                <th className="text-left p-3">Flat</th>
                <th className="text-left p-3">Resident Email</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v._id} className="border-t border-white/10">
                  <td className="p-3">
                    {v.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photoUrl} alt={v.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs opacity-70">—</div>
                    )}
                  </td>
                  <td className="p-3">{v.name}</td>
                  <td className="p-3">{v.purpose || v.reason || '—'}</td>
                  <td className="p-3">{v.flatNumber || '—'}</td>
                  <td className="p-3">{v.residentEmail || '—'}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded border ${badge(v.status)}`}>{v.status}</span></td>
                  <td className="p-3">{v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="p-4 opacity-70" colSpan={7}>No visitors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
