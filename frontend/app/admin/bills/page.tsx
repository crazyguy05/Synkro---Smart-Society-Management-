"use client";
import { useEffect, useMemo, useState } from 'react';
import { Plus, Calculator, Receipt, CreditCard, RefreshCw } from 'lucide-react';
import Shell from '../../../components/Shell';
import Card from '../../../components/ui/Card';
import Badge, { statusTone } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import EmptyState from '../../../components/ui/EmptyState';
import { api } from '../../../lib/api';

export default function AdminBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sort, setSort] = useState<'dueDate' | 'resident'>('dueDate');

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
    category: 'Maintenance', description: '', amount: '', issueDate: '', dueDate: '',
  });

  const stats = useMemo(() => {
    const total = bills.length;
    const paid = bills.filter(b => b.status === 'Paid').length;
    const overdue = bills.filter(b => b.status === 'Overdue').length;
    const unpaid = bills.filter(b => b.status === 'Unpaid').length;
    return { total, paid, overdue, unpaid };
  }, [bills]);

  useEffect(() => { fetchData(); fetchUsers(); }, [filterStatus, sort]);

  const fetchData = async () => {
    try {
      let url = `/api/billing?`;
      if (filterStatus) url += `status=${filterStatus}&`;
      if (sort) url += `sort=${sort}`;
      setBills(await api(url));
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const list = await api('/api/auth/users?role=resident');
      setUsers(Array.isArray(list) ? list : []);
    } catch { setUsers([]); }
  };

  const fetchPreview = async () => {
    if (!rate || Number(rate) <= 0) return;
    setPreviewing(true);
    try {
      const data = await api(`/api/billing/maintenance-preview?ratePerSqFt=${rate}`);
      setPreview(data.preview);
    } catch {} finally { setPreviewing(false); }
  };

  const saveArea = async (userId: string, areaSqFt: number) => {
    setSavingArea(userId);
    try {
      await api(`/api/auth/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ areaSqFt }) });
      setPreview(prev => prev.map(r =>
        r._id === userId ? { ...r, areaSqFt, amount: parseFloat((areaSqFt * Number(rate)).toFixed(2)) } : r,
      ));
    } catch {} finally { setSavingArea(null); }
  };

  const generateMaintenance = async () => {
    if (!rate || Number(rate) <= 0) return;
    setGenerating(true);
    try {
      const data = await api('/api/billing/bulk-maintenance', {
        method: 'POST',
        body: JSON.stringify({ ratePerSqFt: Number(rate), dueDate: calcDueDate || undefined, month: calcMonth }),
      });
      alert(`Generated ${data.generated} maintenance bill(s)`);
      setCalcOpen(false); setPreview([]);
      fetchData();
    } catch (e: any) {
      alert('Failed: ' + e.message);
    } finally { setGenerating(false); }
  };

  const onUserChange = (id: string) => {
    setForm(f => ({ ...f, residentId: id }));
    const u = users.find((u: any) => u._id === id);
    if (u?.apartment) setForm(f => ({ ...f, flatNumber: u.apartment }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!form.residentId && !form.residentEmail) || !form.category || !form.amount) return;
    setLoading(true);
    try {
      await api('/api/billing/new', {
        method: 'POST',
        body: JSON.stringify({
          residentId: form.residentId || undefined,
          residentEmail: form.residentEmail || undefined,
          flatNumber: form.flatNumber || undefined,
          category: form.category,
          description: form.description,
          amount: Number(form.amount),
          issueDate: form.issueDate || undefined,
          dueDate: form.dueDate || undefined,
        }),
      });
      setOpen(false);
      setForm({ residentId: '', residentEmail: '', flatNumber: '', category: 'Maintenance', description: '', amount: '', issueDate: '', dueDate: '' });
      fetchData();
    } finally { setLoading(false); }
  };

  const markPaid = async (id: string) => {
    try { await api(`/api/billing/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Paid' }) }); fetchData(); } catch {}
  };

  const totalPreview = preview.reduce((s, r) => s + r.amount, 0);
  const eligibleCount = preview.filter(r => r.areaSqFt > 0).length;

  return (
    <Shell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="heading text-2xl">Bills Management</h2>
          <p className="text-sm text-muted">Generate maintenance and custom bills for residents.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" leftIcon={<Calculator size={15} />} onClick={() => setCalcOpen(true)}>Maintenance Calculator</Button>
          <Button leftIcon={<Plus size={15} />} onClick={() => setOpen(true)}>New Bill</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total" value={stats.total} tone="brand" />
        <Stat label="Unpaid" value={stats.unpaid} tone="amber" />
        <Stat label="Overdue" value={stats.overdue} tone="rose" />
        <Stat label="Paid" value={stats.paid} tone="emerald" />
      </div>

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
            <option value="Paid">Paid</option>
          </select>
          <select className="input w-auto" value={sort} onChange={e => setSort(e.target.value as any)}>
            <option value="dueDate">Sort: Due Date</option>
            <option value="resident">Sort: Resident</option>
          </select>
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={13} />} onClick={fetchData}>Refresh</Button>
        </div>
      </Card>

      {bills.length === 0 ? (
        <EmptyState icon={<Receipt size={22} />} title="No bills" description="Create maintenance bills or add one manually." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--card-muted)] text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Bill ID</th>
                  <th className="text-left px-4 py-3">Flat</th>
                  <th className="text-left px-4 py-3">Resident</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Due</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bills.map(b => (
                  <tr key={b._id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-2.5 font-mono text-xs">{b.billId || '—'}</td>
                    <td className="px-4 py-2.5">{b.flatNumber || '—'}</td>
                    <td className="px-4 py-2.5">{b.resident?.name || '—'}</td>
                    <td className="px-4 py-2.5">{b.category}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">₹{(+b.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-muted">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-2.5"><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
                    <td className="px-4 py-2.5 text-right">
                      {b.status !== 'Paid' && (
                        <Button size="sm" variant="ghost" leftIcon={<CreditCard size={13} />} onClick={() => markPaid(b._id)}>Mark Paid</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New bill */}
      <Modal
        open={open} onClose={() => !loading && setOpen(false)} title="Add New Bill" size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={submit} loading={loading} disabled={(!form.residentId && !form.residentEmail) || !form.amount}>Save Bill</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          {users.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Resident</label>
                <select className="input" value={form.residentId} onChange={e => onUserChange(e.target.value)}>
                  <option value="">Select Resident</option>
                  {users.map((u: any) => (
                    <option key={u._id} value={u._id}>{u.name} {u.apartment ? `(${u.apartment})` : ''}</option>
                  ))}
                </select>
              </div>
              <Input label="Flat Number" value={form.flatNumber} onChange={e => setForm(f => ({ ...f, flatNumber: e.target.value }))} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Resident Email" value={form.residentEmail} onChange={e => setForm(f => ({ ...f, residentEmail: e.target.value }))} />
              <Input label="Flat Number" value={form.flatNumber} onChange={e => setForm(f => ({ ...f, flatNumber: e.target.value }))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option>Maintenance</option><option>Water</option><option>Electricity</option><option>Parking</option><option>Misc</option>
              </select>
            </div>
            <Input label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Description</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Issue Date" type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
            <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Maintenance calculator */}
      <Modal
        open={calcOpen} onClose={() => !generating && setCalcOpen(false)} title="Maintenance Calculator" size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCalcOpen(false)} disabled={generating}>Close</Button>
            {preview.length > 0 && (
              <Button loading={generating} disabled={eligibleCount === 0} onClick={generateMaintenance}>
                Generate {eligibleCount} bill{eligibleCount !== 1 ? 's' : ''}
              </Button>
            )}
          </>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Rate (₹/sq ft)" type="number" value={rate} onChange={e => { setRate(e.target.value); setPreview([]); }} placeholder="e.g. 2.5" />
          <Input label="Month" type="month" value={calcMonth} onChange={e => setCalcMonth(e.target.value)} />
          <Input label="Due Date" type="date" value={calcDueDate} onChange={e => setCalcDueDate(e.target.value)} />
          <div className="flex items-end">
            <Button className="w-full" variant="ghost" loading={previewing} onClick={fetchPreview} disabled={!rate}>Preview</Button>
          </div>
        </div>

        {preview.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted">Enter each flat's area. Amount recalculates automatically.</p>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--card-muted)] text-muted text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-2.5">Resident</th>
                    <th className="text-left px-4 py-2.5">Flat</th>
                    <th className="text-left px-4 py-2.5">Area (sq ft)</th>
                    <th className="text-right px-4 py-2.5">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {preview.map(r => (
                    <tr key={r._id}>
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2">{r.apartment || '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="0"
                            className="w-24 px-2 py-1 rounded bg-[var(--card-muted)] border border-[var(--border)] text-sm"
                            placeholder="sq ft"
                            defaultValue={r.areaSqFt > 0 ? r.areaSqFt : ''}
                            onBlur={e => {
                              const val = Number(e.target.value);
                              if (val > 0 && val !== r.areaSqFt) saveArea(r._id, val);
                            }}
                          />
                          {savingArea === r._id && <span className="text-xs text-muted">Saving…</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {r.areaSqFt > 0
                          ? <span className="text-emerald-400 font-semibold">₹{r.amount}</span>
                          : <span className="text-amber-400 text-xs">Enter area</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--card-muted)]">
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 font-medium">Total</td>
                    <td className="px-4 py-2.5 text-right font-bold">₹{totalPreview.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-xs text-muted">{eligibleCount} of {preview.length} residents have area set. Others will be skipped.</p>
          </div>
        )}
      </Modal>
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
        <Receipt size={17} />
      </div>
      <div className="text-xs text-muted">{label}</div>
      <div className="heading text-2xl mt-0.5">{value}</div>
    </div>
  );
}
