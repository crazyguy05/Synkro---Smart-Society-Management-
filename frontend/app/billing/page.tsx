"use client";
import { useEffect, useMemo, useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';

export default function BillingPage() {
  const [bills, setBills] = useState<any[]>([]);
  const fetchBills = async () => { try { setBills(await api('/api/billing/me')); } catch {} };
  useEffect(() => { fetchBills(); }, []);

  const stats = useMemo(() => {
    const total = bills.length;
    const paid = bills.filter(b => b.status === 'Paid').length;
    const overdue = bills.filter(b => b.status === 'Overdue').length;
    const unpaid = bills.filter(b => b.status === 'Unpaid').length;
    const totalDue = bills
      .filter(b => b.status !== 'Paid')
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    return { total, paid, overdue, unpaid, totalDue };
  }, [bills]);

  const badge = (s: string) => s === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : s === 'Overdue' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Total</div><div className="text-2xl font-semibold">{stats.total}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Unpaid</div><div className="text-2xl font-semibold">{stats.unpaid}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Overdue</div><div className="text-2xl font-semibold">{stats.overdue}</div></div>
          <div className="card p-4 border border-white/10 bg-white/5 rounded-xl"><div className="text-xs opacity-70">Total Due</div><div className="text-2xl font-semibold">₹{stats.totalDue}</div></div>
        </div>

        <div className="card p-4 border border-white/10 bg-white/5 rounded-xl">
          <h2 className="font-semibold mb-3">My Bills</h2>
          <div className="overflow-auto rounded border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-3">Bill ID</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Due Date</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b._id} className="border-t border-white/10">
                    <td className="p-3">{b.billId || '—'}</td>
                    <td className="p-3">{b.category || '—'}</td>
                    <td className="p-3">₹{b.amount?.toFixed?.(2) ?? b.amount}</td>
                    <td className="p-3">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded border ${badge(b.status)}`}>{b.status}</span></td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr><td className="p-4 opacity-70" colSpan={5}>No bills found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
