"use client";
import { useEffect, useMemo, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

export default function AdminBillsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sort, setSort] = useState<'dueDate'|'resident'>('dueDate');

  const [form, setForm] = useState({
    residentId: '',
    residentEmail: '',
    flatNumber: '',
    category: 'Maintenance',
    description: '',
    amount: '',
    issueDate: '',
    dueDate: ''
  });

  const stats = useMemo(() => {
    const total = bills.length;
    const paid = bills.filter(b => b.status === 'Paid').length;
    const overdue = bills.filter(b => b.status === 'Overdue').length;
    const unpaid = bills.filter(b => b.status === 'Unpaid').length;
    return { total, paid, overdue, unpaid };
  }, [bills]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchData();
    fetchUsers();
  }, [user, filterStatus, sort]);

  async function fetchData() {
    try {
      let url = `/api/billing?`;
      if (filterStatus) url += `status=${filterStatus}&`;
      if (sort) url += `sort=${sort}`;
      setBills(await api(url));
    } catch {}
  }

  async function fetchUsers() {
    try {
      // minimal: reusing existing endpoint if present; fallback to auth/me role
      // If you have /api/users?role=resident, switch to it. For now, get from /api/visitors as placeholder is not ideal, so keep manual input option.
      const list = await api('/api/auth/users?role=resident'); // admin-only
      setUsers(Array.isArray(list) ? list : []);
    } catch { setUsers([]); }
  }

  const onUserChange = (id: string) => {
    setForm(f => ({ ...f, residentId: id }));
    const u = users.find((u: any) => u._id === id);
    if (u?.flatNumber) setForm(f => ({ ...f, flatNumber: u.flatNumber }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if ((!form.residentId && !form.residentEmail) || !form.category || !form.amount) return;
    setLoading(true);
    try {
      await api('/api/billing/new', { method: 'POST', body: JSON.stringify({
        residentId: form.residentId || undefined,
        residentEmail: form.residentEmail || undefined,
        flatNumber: form.flatNumber || undefined,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        issueDate: form.issueDate || undefined,
        dueDate: form.dueDate || undefined
      })});
      setOpen(false);
      setForm({ residentId: '', residentEmail: '', flatNumber: '', category: 'Maintenance', description: '', amount: '', issueDate: '', dueDate: '' });
      fetchData();
    } finally { setLoading(false); }
  }

  async function markPaid(id: string) {
    try { await api(`/api/billing/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Paid' }) }); fetchData(); } catch {}
  }

  if (user?.role !== 'admin') return (
    <Shell>
      <div className="p-6">Only admins can view this page.</div>
    </Shell>
  );

  const badge = (s: string) => s === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : s === 'Overdue' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Total</div><div className="text-2xl font-semibold">{stats.total}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Unpaid</div><div className="text-2xl font-semibold">{stats.unpaid}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Overdue</div><div className="text-2xl font-semibold">{stats.overdue}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Paid</div><div className="text-2xl font-semibold">{stats.paid}</div></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">All</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
            </select>
            <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={sort} onChange={e=>setSort(e.target.value as any)}>
              <option value="dueDate">Sort by Due Date</option>
              <option value="resident">Sort by Resident</option>
            </select>
          </div>
          <button className="btn-glow px-3 py-2 rounded" onClick={()=>setOpen(true)}>Add New Bill</button>
        </div>

        <div className="overflow-auto rounded border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-3">Bill ID</th>
                <th className="text-left p-3">Flat</th>
                <th className="text-left p-3">Resident</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Due Date</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(b => (
                <tr key={b._id} className="border-t border-white/10">
                  <td className="p-3">{b.billId || '—'}</td>
                  <td className="p-3">{b.flatNumber || '—'}</td>
                  <td className="p-3">{b.resident?.name || '—'}</td>
                  <td className="p-3">{b.category || '—'}</td>
                  <td className="p-3">₹{b.amount?.toFixed?.(2) ?? b.amount}</td>
                  <td className="p-3">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded border ${badge(b.status)}`}>{b.status}</span></td>
                  <td className="p-3">
                    {b.status !== 'Paid' && (
                      <button className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={()=>markPaid(b._id)}>Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td className="p-4 opacity-70" colSpan={8}>No bills found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {open && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={()=>!loading && setOpen(false)} />
            <div className="relative z-50 w-full max-w-xl card p-5 border border-white/10 bg-white/5 rounded-xl">
              <h3 className="font-medium mb-3">Add New Bill</h3>
              <form onSubmit={submit} className="grid gap-3">
                {users.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={form.residentId} onChange={e=>onUserChange(e.target.value)}>
                      <option value="">Select Resident</option>
                      {users.map((u:any)=> (
                        <option key={u._id} value={u._id}>{u.name} {u.flatNumber ? `(${u.flatNumber})` : ''}</option>
                      ))}
                    </select>
                    <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Flat Number" value={form.flatNumber} onChange={e=>setForm(f=>({ ...f, flatNumber: e.target.value }))} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Resident Email" value={form.residentEmail} onChange={e=>setForm(f=>({ ...f, residentEmail: e.target.value }))} />
                    <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Flat Number (optional)" value={form.flatNumber} onChange={e=>setForm(f=>({ ...f, flatNumber: e.target.value }))} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={form.category} onChange={e=>setForm(f=>({ ...f, category: e.target.value }))}>
                    <option>Maintenance</option>
                    <option>Water</option>
                    <option>Electricity</option>
                    <option>Parking</option>
                    <option>Misc</option>
                  </select>
                  <input type="number" className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Amount" value={form.amount} onChange={e=>setForm(f=>({ ...f, amount: e.target.value }))} />
                </div>
                <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10 min-h-[100px]" placeholder="Description" value={form.description} onChange={e=>setForm(f=>({ ...f, description: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" className="px-3 py-2 rounded bg-white/5 border border-white/10" value={form.issueDate} onChange={e=>setForm(f=>({ ...f, issueDate: e.target.value }))} />
                  <input type="date" className="px-3 py-2 rounded bg-white/5 border border-white/10" value={form.dueDate} onChange={e=>setForm(f=>({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" className="px-3 py-2 rounded border border-white/10 bg-white/5" onClick={()=>setOpen(false)} disabled={loading}>Cancel</button>
                  <button className="btn-glow px-3 py-2 rounded" disabled={loading || (!form.residentId && !form.residentEmail) || !form.amount}>{loading ? 'Saving…' : 'Save Bill'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
