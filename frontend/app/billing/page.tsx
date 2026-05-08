"use client";
import { useEffect, useMemo, useState } from 'react';
import { Receipt, Wallet, AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';
import Shell from '../../components/Shell';
import Card from '../../components/ui/Card';
import Badge, { statusTone } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../lib/api';

type Bill = {
  _id: string; billId?: string; category: string;
  amount: number; status: 'Paid' | 'Unpaid' | 'Overdue';
  dueDate?: string; issueDate?: string; description?: string;
};

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [paying, setPaying] = useState<string | null>(null);

  const fetchBills = async () => { try { setBills(await api('/api/billing/me')); } catch {} };
  useEffect(() => { fetchBills(); }, []);

  const stats = useMemo(() => {
    const total = bills.length;
    const paid = bills.filter(b => b.status === 'Paid').length;
    const overdue = bills.filter(b => b.status === 'Overdue').length;
    const unpaid = bills.filter(b => b.status === 'Unpaid').length;
    const totalDue = bills.filter(b => b.status !== 'Paid').reduce((s, b) => s + (+b.amount || 0), 0);
    return { total, paid, overdue, unpaid, totalDue };
  }, [bills]);

  const markPaid = async (id: string) => {
    setPaying(id);
    try {
      await api(`/api/billing/${id}/paid`, { method: 'PATCH' });
      await fetchBills();
    } catch {} finally { setPaying(null); }
  };

  return (
    <Shell>
      <div>
        <h2 className="heading text-2xl">My Bills</h2>
        <p className="text-sm text-muted">Track and settle your monthly dues.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={<Wallet size={18} />} label="Total Due" value={`₹${stats.totalDue.toLocaleString('en-IN')}`} tone="brand" accent />
        <SummaryCard icon={<AlertTriangle size={18} />} label="Overdue" value={stats.overdue} tone="rose" />
        <SummaryCard icon={<Receipt size={18} />} label="Unpaid" value={stats.unpaid} tone="amber" />
        <SummaryCard icon={<CheckCircle2 size={18} />} label="Paid" value={stats.paid} tone="emerald" />
      </div>

      {bills.length === 0 ? (
        <EmptyState icon={<Receipt size={22} />} title="No bills" description="You're all caught up." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--card-muted)] text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Bill ID</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-right px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Due Date</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bills.map(b => (
                  <tr key={b._id} className="hover:bg-white/5 transition">
                    <td className="px-5 py-3 font-mono text-xs">{b.billId ?? '—'}</td>
                    <td className="px-5 py-3 font-medium">{b.category}</td>
                    <td className="px-5 py-3 text-right font-semibold">₹{(+b.amount).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-muted">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      {b.status !== 'Paid' && (
                        <Button
                          size="sm"
                          leftIcon={<CreditCard size={13} />}
                          loading={paying === b._id}
                          onClick={() => markPaid(b._id)}
                        >
                          Pay
                        </Button>
                      )}
                    </td>
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

function SummaryCard({ icon, label, value, tone, accent }: {
  icon: React.ReactNode; label: string; value: React.ReactNode;
  tone: 'brand' | 'emerald' | 'amber' | 'rose'; accent?: boolean;
}) {
  const toneBg: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
  };
  return (
    <div className={`card p-4 ${accent ? 'bg-gradient-to-br from-brand-500/10 to-accent-violet/10 border-brand-500/30' : ''}`}>
      <div className={`h-9 w-9 rounded-xl grid place-items-center mb-3 ${toneBg[tone]}`}>{icon}</div>
      <div className="text-xs text-muted">{label}</div>
      <div className="heading text-2xl mt-0.5">{value}</div>
    </div>
  );
}
