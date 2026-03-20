"use client";
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import Shell from '../../components/Shell';
import PanicButton from '../../components/PanicButton';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';

type Bill = {
  _id: string;
  amount?: number;
  maintenance?: number;
  electricity?: number;
  water?: number;
  dueDate?: string;
  updatedAt?: string;
  status?: 'Unpaid' | 'Paid' | 'Overdue';
  paid?: boolean;
};

type Notice = {
  _id: string;
  title: string;
  body: string;
  createdAt?: string;
};

type LeaderboardRow = {
  _id: string;
  resident?: { name?: string; apartment?: string };
  points: number;
};

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const getBillAmount = (b: Bill) => Number(b.amount ?? ((b.maintenance || 0) + (b.electricity || 0) + (b.water || 0))) || 0;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const billingPath = user?.role === 'resident' ? '/api/billing/me' : '/api/billing?sort=dueDate';
        const [billsRes, noticesRes, leaderboardRes] = await Promise.all([
          api(billingPath),
          api('/api/notices'),
          api('/api/leaderboard'),
        ]);
        if (!active) return;
        setBills(Array.isArray(billsRes) ? billsRes : []);
        setNotices(Array.isArray(noticesRes) ? noticesRes : []);
        setLeaderboard(Array.isArray(leaderboardRes) ? leaderboardRes : []);
      } catch (e: any) {
        if (!active) return;
        const text = typeof e?.message === 'string' ? e.message : '';
        setError(text || 'Failed to load dashboard analytics');
      } finally {
        if (active) setLoading(false);
      }
    };
    if (user) load();
    return () => {
      active = false;
    };
  }, [user]);

  const analytics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    let paid = 0;
    let unpaid = 0;
    let overdue = 0;
    let paidOnTimeThisMonth = 0;

    for (const bill of bills) {
      const status = bill.status ?? (bill.paid ? 'Paid' : 'Unpaid');
      if (status === 'Paid') paid += 1;
      if (status === 'Unpaid') unpaid += 1;
      if (status === 'Overdue') overdue += 1;

      if (status === 'Paid' && bill.dueDate && bill.updatedAt) {
        const due = new Date(bill.dueDate);
        const paidAt = new Date(bill.updatedAt);
        if (due >= monthStart && due < nextMonthStart && paidAt <= due) {
          paidOnTimeThisMonth += 1;
        }
      }
    }

    const total = bills.length;
    const paidPct = total ? Math.round((paid / total) * 100) : 0;
    const unpaidPct = total ? Math.round((unpaid / total) * 100) : 0;
    const overduePct = total ? Math.round((overdue / total) * 100) : 0;
    const totalAmount = bills.reduce((sum, b) => sum + getBillAmount(b), 0);
    const totalDue = bills
      .filter((b) => (b.status ?? (b.paid ? 'Paid' : 'Unpaid')) !== 'Paid')
      .reduce((sum, b) => sum + getBillAmount(b), 0);

    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      return { label, paid: 0, unpaid: 0 };
    });

    for (const bill of bills) {
      if (!bill.dueDate) continue;
      const due = new Date(bill.dueDate);
      const idx = monthly.findIndex(
        (m, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).getMonth() === due.getMonth() &&
          new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).getFullYear() === due.getFullYear()
      );
      if (idx === -1) continue;
      const status = bill.status ?? (bill.paid ? 'Paid' : 'Unpaid');
      if (status === 'Paid') monthly[idx].paid += 1;
      else monthly[idx].unpaid += 1;
    }

    return {
      total,
      paid,
      unpaid,
      overdue,
      paidOnTimeThisMonth,
      totalAmount,
      totalDue,
      paidPct,
      unpaidPct,
      overduePct,
      monthly,
    };
  }, [bills]);

  const topLeaderboard = useMemo(() => leaderboard.slice(0, 5), [leaderboard]);
  const maxPoints = useMemo(() => Math.max(1, ...topLeaderboard.map((r) => r.points || 0)), [topLeaderboard]);
  const latestNotices = useMemo(() => notices.slice(0, 3), [notices]);

  return (
    <Shell>
      <button
        type="button"
        onClick={handleSignOut}
        className="fixed bottom-4 left-4 z-50 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition"
      >
        Sign Out
      </button>
      <div className="grid gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Welcome{user ? `, ${user.name}` : ''}</h2>
              <p className="opacity-80 text-sm">Role: {user?.role ?? 'guest'}</p>
            </div>
            <PanicButton />
          </div>
        </div>

        {error && (
          <div className="card p-4 border border-red-500/30">
            <p className="text-sm text-red-300">Analytics load issue: {error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm opacity-70">Total Bills</p>
            <p className="text-2xl font-semibold mt-1">{loading ? '--' : analytics.total}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm opacity-70">Paid On Time (This Month)</p>
            <p className="text-2xl font-semibold mt-1">{loading ? '--' : analytics.paidOnTimeThisMonth}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm opacity-70">{user?.role === 'resident' ? 'Total Due' : 'Collection Pool'}</p>
            <p className="text-2xl font-semibold mt-1">
              {loading ? '--' : currency.format(user?.role === 'resident' ? analytics.totalDue : analytics.totalAmount)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm opacity-70">Open Risk (Unpaid + Overdue)</p>
            <p className="text-2xl font-semibold mt-1">{loading ? '--' : analytics.unpaid + analytics.overdue}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-2 space-y-4">
            <div>
              <h3 className="font-medium">Billing Analytics</h3>
              <p className="opacity-75 text-sm">Payment health and monthly trend.</p>
            </div>

            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
                <div className="bg-emerald-500" style={{ width: `${analytics.paidPct}%` }} />
                <div className="bg-amber-400" style={{ width: `${analytics.unpaidPct}%` }} />
                <div className="bg-red-500" style={{ width: `${analytics.overduePct}%` }} />
              </div>
              <div className="text-xs opacity-80 flex flex-wrap gap-3">
                <span>Paid: {analytics.paid}</span>
                <span>Unpaid: {analytics.unpaid}</span>
                <span>Overdue: {analytics.overdue}</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 items-end h-40">
              {analytics.monthly.map((m) => {
                const total = Math.max(1, m.paid + m.unpaid);
                const paidH = Math.max(8, Math.round((m.paid / total) * 110));
                const unpaidH = Math.max(8, Math.round((m.unpaid / total) * 110));
                return (
                  <div key={m.label} className="flex flex-col items-center gap-2">
                    <div className="flex items-end gap-1 h-28">
                      <div className="w-3 rounded-t bg-emerald-500" style={{ height: `${paidH}px` }} title={`Paid: ${m.paid}`} />
                      <div className="w-3 rounded-t bg-amber-400" style={{ height: `${unpaidH}px` }} title={`Unpaid/Overdue: ${m.unpaid}`} />
                    </div>
                    <span className="text-xs opacity-70">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <div>
              <h3 className="font-medium">Leaderboard Insights</h3>
              <p className="opacity-75 text-sm">Top contributors by points.</p>
            </div>

            {topLeaderboard.length === 0 && <p className="text-sm opacity-70">{loading ? 'Loading...' : 'No leaderboard data yet.'}</p>}

            {topLeaderboard.map((row, idx) => (
              <div key={row._id || `${row.resident?.name}-${idx}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate mr-2">{row.resident?.name || `Resident ${idx + 1}`}</span>
                  <span className="opacity-80">{row.points} pts</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    style={{ width: `${Math.max(10, Math.round((row.points / maxPoints) * 100))}%` }}
                  />
                </div>
                <p className="text-xs opacity-60">{row.resident?.apartment || 'Flat N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-medium">Latest Notices</h3>
          <p className="opacity-75 text-sm mb-3">Most recent society updates.</p>
          {latestNotices.length === 0 ? (
            <p className="text-sm opacity-70">{loading ? 'Loading...' : 'No notices available.'}</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-3">
              {latestNotices.map((n) => (
                <div key={n._id} className="rounded-lg border border-white/10 p-3 bg-white/5">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm opacity-80 mt-1 line-clamp-3">{n.body}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recently posted'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
