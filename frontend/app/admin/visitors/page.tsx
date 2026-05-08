"use client";
import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, RefreshCw, UserCheck } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Badge, { statusTone } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { api } from '../../../lib/api';

type Visitor = {
  _id: string; name: string; purpose?: string; reason?: string;
  flatNumber?: string; residentEmail?: string;
  status: string; photoUrl?: string; createdAt?: string;
};

export default function AdminVisitorsPage() {
  const [list, setList] = useState<Visitor[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchList = async () => {
    try { const data = await api('/api/visitors'); setList(Array.isArray(data) ? data : []); } catch {}
  };

  useEffect(() => {
    fetchList();
    const id = setInterval(fetchList, 10000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => list.filter(v => {
    if (status && v.status !== status) return false;
    if (query) {
      const q = query.toLowerCase();
      const str = `${v.name} ${v.flatNumber || ''} ${v.residentEmail || ''}`.toLowerCase();
      if (!str.includes(q)) return false;
    }
    if (from && new Date(v.createdAt!).getTime() < new Date(from).getTime()) return false;
    if (to && new Date(v.createdAt!).getTime() > new Date(to).getTime() + 86_400_000 - 1) return false;
    return true;
  }), [list, status, query, from, to]);

  const stats = useMemo(() => ({
    total: filtered.length,
    pending: filtered.filter(v => /pending/i.test(v.status)).length,
    approved: filtered.filter(v => /approved|allowed/i.test(v.status)).length,
    rejected: filtered.filter(v => /rejected|denied/i.test(v.status)).length,
  }), [filtered]);

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">Visitor Analytics</h2>
          <p className="text-sm text-muted">Search, filter and audit visitor entries.</p>
        </div>
        <Button variant="ghost" leftIcon={<RefreshCw size={14} />} onClick={fetchList}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total" value={stats.total} tone="brand" />
        <Stat label="Pending" value={stats.pending} tone="amber" />
        <Stat label="Approved" value={stats.approved} tone="emerald" />
        <Stat label="Rejected" value={stats.rejected} tone="rose" />
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3">
          <div className="relative">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input className="input pl-10" placeholder="Search name / flat / email" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<UserCheck size={22} />} title="No visitors match" description="Adjust the filters or date range." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--card-muted)] text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Photo</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Purpose</th>
                  <th className="text-left px-4 py-3">Flat</th>
                  <th className="text-left px-4 py-3">Resident Email</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map(v => (
                  <tr key={v._id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-2">
                      {v.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.photoUrl} alt={v.name} className="w-10 h-10 object-cover rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[var(--card-muted)] grid place-items-center text-muted text-xs">—</div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium">{v.name}</td>
                    <td className="px-4 py-2 text-muted">{v.purpose || v.reason || '—'}</td>
                    <td className="px-4 py-2">{v.flatNumber || '—'}</td>
                    <td className="px-4 py-2 text-muted">{v.residentEmail || '—'}</td>
                    <td className="px-4 py-2"><Badge tone={statusTone(v.status)}>{v.status}</Badge></td>
                    <td className="px-4 py-2 text-muted">{v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Shell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'brand' | 'emerald' | 'amber' | 'rose' }) {
  const bg: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
  };
  return (
    <div className="card p-4">
      <div className={`h-9 w-9 rounded-xl grid place-items-center mb-3 ${bg[tone]}`}>
        <UserCheck size={17} />
      </div>
      <div className="text-xs text-muted">{label}</div>
      <div className="heading text-2xl mt-0.5">{value}</div>
    </div>
  );
}
