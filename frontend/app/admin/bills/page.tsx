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

  // Maintenance calculator state
  const [calcOpen, setCalcOpen] = useState(false);
  const [rate, setRate] = useState('');
  const [calcDueDate, setCalcDueDate] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [calcMonth, setCalcMonth] = useState(new Date().toISOString().slice(0, 7));
  const [savingArea, setSavingArea] = useState<string | null>(null);

  const [form, setForm] = useState({
    residentId: '', residentEmail: '', flatNumber: '',
    category: 'Maintenance', description: '', amount: '', issueDate: '', dueDate: ''
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
      const list = await api('/api/auth/users?role=resident');
      setUsers(Array.isArray(list) ? list : []);
    } catch { setUsers([]); }
  }

  async function fetchPreview() {
    if (!rate || Number(rate) <= 0) return;
    setPreviewing(true);
    try {
      const data = await api(`/api/billing/maintenance-preview?ratePerSqFt=${rate}`);
      setPreview(data.preview);
    } catch {}
    finally { setPreviewing(false); }
  }

  async function saveArea(userId: string, areaSqFt: number) {
    setSavingArea(userId);
    try {
      await api(`/api/auth/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ areaSqFt })
      });
      // Recalculate amount for this row
      setPreview(prev => prev.map(r =>
        r._id === userId
          ? { ...r, areaSqFt, amount: parseFloat((areaSqFt * Number(rate)).toFixed(2)) }
          : r
      ));
    } catch {}
    finally { setSavingArea(null); }
  }

  async function generateMaintenance() {
    if (!rate || Number(rate) <= 0) return;
    setGenerating(true);
    try {
      const data = await api('/api/billing/bulk-maintenance', {
        method: 'POST',
        body: JSON.stringify({ ratePerSqFt: Number(rate), dueDate: calcDueDate || undefined, month: calcMonth })
      });
      alert(`✅ Generated ${data.generated} maintenance bill(s)`);
      setCalcOpen(false);
      setPreview([]);
      fetchData();
    } catch (e: any) {
      alert('Failed: ' + e.message);
    }
    finally { setGenerating(false); }
  }

  const onUserChange = (id: string) => {
    setForm(f => ({ ...f, residentId: id }));
    const u = users.find((u: any) => u._id === id);
    if (u?.apartment) setForm(f => ({ ...f, flatNumber: u.apartment }));
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
    <Shell><div className="p-6">Only admins can view this page.</div></Shell>
  );

  const badge = (s: string) => s === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : s === 'Overdue' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  const totalPreview = preview.reduce((s, r) => s + r.amount, 0);
  const eligibleCount = preview.filter(r => r.areaSqFt > 0).length;

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Total</div><div className="text-2xl font-semibold">{stats.total}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Unpaid</div><div className="text-2xl font-semibold">{stats.unpaid}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Overdue</div><div className="text-2xl font-semibold">{stats.overdue}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Paid</div><div className="text-2xl font-semibold">{stats.paid}</div></div>
        </div>

        {/* Maintenance Calculator */}
        <div className="card border border-white/10 bg-white/5 rounded-xl overflow-hidden">
          <button
            className="w-full flex justify-between items-center px-4 py-3 font-medium hover:bg-white/5"
            onClick={() => setCalcOpen(v => !v)}
          >
            <span>🧮 Maintenance Calculator (Area-based)</span>
            <span className="text-xs opacity-60">{calcOpen ? '▲ Hide' : '▼ Expand'}</span>
          </button>

          {calcOpen && (
            <div className="px-4 pb-4 grid gap-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3 mt-3 md:grid-cols-4">
                <div>
                  <label className="text-xs opacity-60 block mb-1">Rate (₹ per sq ft)</label>
                  <input
                    type="number" min="0" step="0.5"
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/10"
                    placeholder="e.g. 2.5"
                    value={rate}
                    onChange={e => { setRate(e.target.value); setPreview([]); }}
                  />
                </div>
                <div>
                  <label className="text-xs opacity-60 block mb-1">Month</label>
                  <input
                    type="month"
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/10"
                    value={calcMonth}
                    onChange={e => setCalcMonth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs opacity-60 block mb-1">Due Date (optional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/10"
                    value={calcDueDate}
                    onChange={e => setCalcDueDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    className="w-full px-3 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                    onClick={fetchPreview}
                    disabled={previewing || !rate}
                  >{previewing ? 'Loading…' : 'Preview'}</button>
                </div>
              </div>

              {preview.length > 0 && (
                <div className="grid gap-3">
                  <p className="text-xs opacity-60">Enter or update each flat's area below. Changes are saved immediately and the amount recalculates automatically.</p>
                  <div className="overflow-auto rounded border border-white/10">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-3">Resident</th>
                          <th className="text-left p-3">Flat</th>
                          <th className="text-left p-3">Area (sq ft)</th>
                          <th className="text-left p-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map(r => (
                          <tr key={r._id} className="border-t border-white/10">
                            <td className="p-3">{r.name}</td>
                            <td className="p-3">{r.apartment || '—'}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  className="w-24 px-2 py-1 rounded bg-white/5 border border-white/10 text-sm"
                                  placeholder="sq ft"
                                  defaultValue={r.areaSqFt > 0 ? r.areaSqFt : ''}
                                  onBlur={e => {
                                    const val = Number(e.target.value);
                                    if (val > 0 && val !== r.areaSqFt) saveArea(r._id, val);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      const val = Number((e.target as HTMLInputElement).value);
                                      if (val > 0 && val !== r.areaSqFt) saveArea(r._id, val);
                                    }
                                  }}
                                />
                                {savingArea === r._id && <span className="text-xs opacity-50">Saving…</span>}
                              </div>
                            </td>
                            <td className="p-3">
                              {r.areaSqFt > 0
                                ? <span className="text-emerald-400 font-medium">₹{r.amount}</span>
                                : <span className="text-yellow-400 text-xs">Enter area first</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-white/5">
                        <tr>
                          <td colSpan={3} className="p-3 font-medium">Total</td>
                          <td className="p-3 font-semibold">₹{totalPreview.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs opacity-50">{eligibleCount} of {preview.length} residents have area set · others will be skipped</p>
                    <button
                      className="btn-glow px-4 py-2 rounded"
                      onClick={generateMaintenance}
                      disabled={generating || eligibleCount === 0}
                    >{generating ? 'Generating…' : `Generate ${eligibleCount} Bill${eligibleCount !== 1 ? 's' : ''}`}</button>
                  </div>
                </div>
              )}
            </div>
          )}
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
                        <option key={u._id} value={u._id}>{u.name} {u.apartment ? `(${u.apartment})` : ''}</option>
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
