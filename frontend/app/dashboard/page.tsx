"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Receipt, Megaphone, Trophy, UserCheck, MessageSquareWarning,
  ArrowRight, ArrowUp, ArrowDown, Filter, Download, Plus, Leaf,
  AlertTriangle, ShieldCheck, Package, Wrench, Waves, Dumbbell, Flame, Users,
} from 'lucide-react';
import Shell from '../../components/Shell';
import PanicButton from '../../components/PanicButton';
import Card from '../../components/ui/Card';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

type Bill = { _id: string; amount: number; status: string; category: string; dueDate?: string; createdAt?: string };
type Notice = { _id: string; title: string; body: string; createdAt: string };
type Visitor = { _id: string; name: string; purpose?: string; status: string; createdAt: string };
type Complaint = { _id: string; title: string; status: string; createdAt: string };
type LeaderRow = { _id: string; resident?: { _id: string; name: string; apartment?: string }; points: number };

type Tone = 'blue' | 'teal' | 'green' | 'amber' | 'violet' | 'slate' | 'rose';

const TILE: Record<Tone, string> = {
  blue:   'tile-blue',
  teal:   'tile-teal',
  green:  'tile-green',
  amber:  'tile-amber',
  violet: 'tile-violet',
  slate:  'tile-slate',
  rose:   'tile-rose',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [myVisitors, setMyVisitors] = useState<Visitor[]>([]);
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);

  useEffect(() => {
    if (!user) return;
    api('/api/notices').then(setNotices).catch(() => {});
    api('/api/leaderboard').then(r => setLeaders(Array.isArray(r) ? r : r.leaderboard || [])).catch(() => {});
    if (user.role === 'resident') {
      api('/api/billing/me').then(setBills).catch(() => {});
      api('/api/visitors/my').then(setMyVisitors).catch(() => {});
      api('/api/complaints/me').then(setComplaints).catch(() => {});
    } else if (user.role === 'admin') {
      api('/api/visitors').then(setAllVisitors).catch(() => {});
      api('/api/complaints').then(setComplaints).catch(() => {});
    } else if (user.role === 'guard') {
      api('/api/visitors').then(setAllVisitors).catch(() => {});
    }
  }, [user]);

  const unpaidTotal = bills.filter(b => b.status !== 'Paid').reduce((s, b) => s + (+b.amount || 0), 0);
  const unpaidCount = bills.filter(b => b.status !== 'Paid').length;
  const pendingVisitors = myVisitors.filter(v => /pending/i.test(v.status));
  const openComplaints = complaints.filter(c => !/resolved/i.test(c.status));
  const myPoints = leaderPoints(leaders, user?.id) ?? 0;

  const stats: StatCardProps[] = useMemo(() => {
    if (user?.role === 'admin') {
      return [
        { id: 'open', label: 'Open Complaints', value: String(openComplaints.length), sub: `${complaints.length} total · this month`,
          delta: { dir: 'flat', value: 'Same' }, icon: MessageSquareWarning, tone: 'amber' },
        { id: 'visitors', label: 'Visitors Today', value: String(visitorsToday(allVisitors)), sub: 'Across all gates',
          delta: { dir: 'up', value: '+3' }, icon: UserCheck, tone: 'blue' },
        { id: 'notices', label: 'Active Notices', value: String(notices.length), sub: '1 urgent · 2 informational',
          delta: { dir: 'flat', value: 'Same' }, icon: Megaphone, tone: 'amber' },
        { id: 'residents', label: 'Residents', value: String(leaders.length), sub: 'Cedarwood Heights',
          delta: { dir: 'up', value: '+2' }, icon: Trophy, tone: 'green' },
      ];
    }
    if (user?.role === 'guard') {
      return [
        { id: 'pending', label: 'Pending', value: String(allVisitors.filter(v => /pending/i.test(v.status)).length), sub: 'Awaiting approval',
          delta: { dir: 'flat', value: 'Live' }, icon: UserCheck, tone: 'amber' },
        { id: 'approved', label: 'Approved Today', value: String(allVisitors.filter(v => /approved|allowed/i.test(v.status) && isToday(v.createdAt)).length),
          sub: 'Across all gates', delta: { dir: 'up', value: '+2' }, icon: ShieldCheck, tone: 'green' },
        { id: 'rejected', label: 'Rejected', value: String(allVisitors.filter(v => /rejected|denied/i.test(v.status)).length), sub: 'This week',
          delta: { dir: 'down', value: '-1' }, icon: AlertTriangle, tone: 'rose' },
      ];
    }
    return [
      { id: 'bills', label: 'Pending Bills',
        value: `₹${unpaidTotal.toLocaleString('en-IN')}`,
        sub: `${unpaidCount || 0} invoice${unpaidCount === 1 ? '' : 's'} · check Billing`,
        delta: { dir: 'down', value: '12%', good: true }, icon: Receipt, tone: 'blue' },
      { id: 'visitors', label: 'Visitor Requests',
        value: String(pendingVisitors.length),
        sub: 'Awaiting your approval',
        delta: { dir: 'up', value: '+1' }, icon: UserCheck, tone: 'teal' },
      { id: 'green', label: 'Green Points',
        value: myPoints.toLocaleString('en-IN'),
        sub: 'Eco-tracker · this month',
        delta: { dir: 'up', value: '+86' }, icon: Leaf, tone: 'green' },
      { id: 'notices', label: 'Active Notices',
        value: String(notices.length),
        sub: '1 urgent · 2 informational',
        delta: { dir: 'flat', value: 'Same' }, icon: Megaphone, tone: 'amber' },
    ];
  }, [user, unpaidTotal, unpaidCount, pendingVisitors.length, openComplaints.length, complaints.length,
      allVisitors, notices.length, leaders.length, myPoints]);

  return (
    <Shell>
      {/* Hero greeting + quick actions row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="heading text-[22px] text-[var(--text)]">
            Here's what's happening at <span className="gradient-text">Cedarwood Heights</span>
          </h2>
          <p className="text-[13px] text-muted mt-1">
            Signed in as <span className="capitalize font-semibold text-[var(--text-soft)]">{user?.role ?? 'guest'}</span>
            {user?.role === 'resident' && <> · Apt 14-B</>}
          </p>
        </div>
        <PanicButton />
      </div>

      {/* Stats */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
      >
        {stats.map(s => <StatCard key={s.id} {...s} />)}
      </div>

      {/* Middle: 60/40 (Activity + Side column) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <ActivityFeed
          notices={notices}
          bills={bills}
          complaints={complaints}
          visitors={user?.role === 'guard' ? allVisitors : myVisitors}
          role={user?.role ?? 'resident'}
        />

        <div className="flex flex-col gap-4 min-w-0">
          <UpcomingBookings />
          <GreenLeaders leaders={leaders} />
        </div>
      </div>

      {/* Bottom: bills (table) for residents, complaints/visitors for others */}
      {user?.role === 'resident' && <BillsTable bills={bills} />}
      {user?.role === 'admin' && <ComplaintsTable complaints={complaints} />}
      {user?.role === 'guard' && <VisitorsTable visitors={allVisitors} />}
    </Shell>
  );
}

/* ───────────────────── Stat card ───────────────────── */
type StatCardProps = {
  id: string; label: string; value: string; sub: string;
  delta: { dir: 'up' | 'down' | 'flat'; value: string; good?: boolean };
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tone: Tone;
};
function StatCard({ label, value, sub, delta, icon: Icon, tone }: StatCardProps) {
  const Trend = delta.dir === 'up' ? ArrowUp : delta.dir === 'down' ? ArrowDown : ArrowRight;
  const trendCls =
    delta.good ? 'trend trend-good-down' :
    delta.dir === 'up'   ? 'trend trend-up' :
    delta.dir === 'down' ? 'trend trend-down' :
                           'trend trend-flat';
  return (
    <Card className="group" hoverable>
      <div className="flex items-start justify-between gap-3">
        <div className={`tile ${TILE[tone]} h-[38px] w-[38px]`}>
          <Icon size={18} strokeWidth={1.85} />
        </div>
        <span className={trendCls}>
          <Trend size={11} strokeWidth={2.5} />
          {delta.value}
        </span>
      </div>
      <div className="mt-4">
        <div className="text-[12.5px] font-medium text-muted">{label}</div>
        <div className="heading text-[26px] mt-1 tabular leading-none text-[var(--text)]" style={{ letterSpacing: '-0.022em' }}>
          {value}
        </div>
        <div className="text-[11.5px] text-faint font-medium mt-1.5">{sub}</div>
      </div>
    </Card>
  );
}

/* ───────────────────── Activity feed ───────────────────── */
type ActivityItem = {
  id: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  tone: Tone;
  title: string;
  detail: string;
  actor: string;
  time: string;
};
function ActivityFeed({
  notices, bills, complaints, visitors, role,
}: {
  notices: Notice[]; bills: Bill[]; complaints: Complaint[]; visitors: Visitor[]; role: string;
}) {
  const items: ActivityItem[] = [];
  for (const n of notices.slice(0, 2)) {
    items.push({ id: 'n-' + n._id, icon: Megaphone, tone: 'violet',
      title: n.title, detail: trimLine(n.body, 80),
      actor: 'Society Committee', time: rel(n.createdAt) });
  }
  if (role === 'resident') {
    for (const b of bills.slice(0, 2)) {
      items.push({ id: 'b-' + b._id, icon: Receipt, tone: 'blue',
        title: `Invoice · ${b.category}`,
        detail: `₹${(+b.amount).toLocaleString('en-IN')}${b.dueDate ? ' · Due ' + new Date(b.dueDate).toLocaleDateString() : ''}`,
        actor: 'Finance Office', time: rel(b.createdAt ?? b.dueDate) });
    }
    for (const c of complaints.slice(0, 1)) {
      items.push({ id: 'c-' + c._id, icon: Wrench, tone: 'amber',
        title: c.title, detail: `Status · ${c.status}`,
        actor: 'Maintenance', time: rel(c.createdAt) });
    }
  } else {
    for (const c of complaints.slice(0, 3)) {
      items.push({ id: 'c-' + c._id, icon: MessageSquareWarning, tone: 'amber',
        title: c.title, detail: `Status · ${c.status}`,
        actor: 'Resident report', time: rel(c.createdAt) });
    }
    for (const v of visitors.slice(0, 2)) {
      items.push({ id: 'v-' + v._id, icon: UserCheck, tone: 'teal',
        title: 'Visitor logged', detail: `${v.name}${v.purpose ? ' · ' + v.purpose : ''}`,
        actor: 'Security', time: rel(v.createdAt) });
    }
  }
  // Always include green-points / package examples for visual richness when DB is sparse
  if (items.length < 4) {
    items.push({ id: 'pk', icon: Package, tone: 'violet',
      title: 'Package received at front desk', detail: 'Amazon · 1 box',
      actor: 'Security', time: '1 hr ago' });
    items.push({ id: 'gp', icon: Leaf, tone: 'green',
      title: '+24 Green Points earned', detail: 'Composted 6 kg organic waste',
      actor: 'Eco-Tracker', time: 'Yesterday' });
  }

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="heading text-[15px]">Recent Activity</h3>
          <p className="text-[12px] text-muted font-medium mt-0.5">Updates from your community, building, and home</p>
        </div>
        <Link href="/notices" className="text-[12px] font-semibold text-[var(--brand-fg)] inline-flex items-center gap-1">
          View all <ArrowRight size={12} strokeWidth={2.2} />
        </Link>
      </div>

      <ol className="relative list-none m-0 p-0">
        {/* Timeline rail */}
        <div
          className="absolute left-[17px] top-4 bottom-4 w-[1.5px]"
          style={{ background: 'linear-gradient(180deg, #e2e8f0 0%, #e2e8f0 70%, transparent 100%)' }}
        />
        {items.slice(0, 6).map(a => {
          const Icon = a.icon;
          return (
            <li key={a.id} className="flex gap-3.5 py-2.5 relative">
              <div
                className={`relative z-[1] grid place-items-center h-9 w-9 rounded-xl bg-white shrink-0 ${tilePlainBorder(a.tone)}`}
                style={{ color: tileFg(a.tone), boxShadow: '0 1px 2px rgba(15,23,42,.04)' }}
              >
                <Icon size={15} strokeWidth={1.9} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex justify-between gap-3 items-baseline">
                  <div className="text-[13.5px] font-semibold text-[var(--text)] truncate">{a.title}</div>
                  <div className="text-[11px] text-faint font-medium tabular shrink-0">{a.time}</div>
                </div>
                <div className="text-[12.5px] text-muted mt-0.5">{a.detail}</div>
                <div className="text-[11px] text-faint font-medium mt-1">{a.actor}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ───────────────────── Upcoming bookings (sample) ───────────────────── */
const SAMPLE_BOOKINGS: Array<{
  id: number; facility: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  tone: Tone; when: string; time: string; party: string; status: 'confirmed' | 'pending';
}> = [
  { id: 1, facility: 'Rooftop Pool',     icon: Waves,    tone: 'teal',   when: 'Today',       time: '5:30 – 6:30 PM', party: '2 guests',          status: 'confirmed' },
  { id: 2, facility: 'Gym · Floor 3',    icon: Dumbbell, tone: 'blue',   when: 'Tomorrow',    time: '7:00 – 8:00 AM', party: 'Solo',              status: 'confirmed' },
  { id: 3, facility: 'Clubhouse Lounge', icon: Users,    tone: 'violet', when: 'Sat',         time: '6:00 – 9:00 PM', party: 'Birthday · 12',     status: 'pending'   },
  { id: 4, facility: 'BBQ Pit · Garden', icon: Flame,    tone: 'amber',  when: 'Sun',         time: '12:00 – 3:00 PM', party: '4 guests',         status: 'confirmed' },
];
function UpcomingBookings() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="heading text-[15px]">Upcoming Bookings</h3>
          <p className="text-[12px] text-muted font-medium mt-0.5">Your reservations across amenities</p>
        </div>
        <button className="btn-primary text-[12px] px-3 py-1.5">
          <Plus size={13} strokeWidth={2.2} /> New
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {SAMPLE_BOOKINGS.map(b => {
          const Icon = b.icon;
          const pending = b.status === 'pending';
          return (
            <div
              key={b.id}
              className="flex items-center gap-3.5 p-3 bg-[var(--card)] rounded-2xl border border-[var(--border-soft)] cursor-pointer transition hover:-translate-y-0.5 hover:shadow-card-soft"
            >
              <div className={`tile ${TILE[b.tone]} h-[42px] w-[42px] shrink-0`}>
                <Icon size={20} strokeWidth={1.85} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 items-baseline">
                  <div className="text-[13.5px] font-semibold text-[var(--text)] truncate">{b.facility}</div>
                  <span
                    className="text-[10.5px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0"
                    style={{
                      background: pending ? '#fef3c7' : '#ecfdf5',
                      color: pending ? '#b45309' : '#059669',
                    }}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="text-[12px] text-muted mt-1 flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-soft)]">{b.when}</span>
                  <span className="h-[3px] w-[3px] rounded-full bg-slate-300" />
                  <span className="tabular">{b.time}</span>
                  <span className="h-[3px] w-[3px] rounded-full bg-slate-300" />
                  <span className="truncate">{b.party}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ───────────────────── Green leaders ───────────────────── */
function GreenLeaders({ leaders }: { leaders: LeaderRow[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="heading text-[15px]">Green Leaders</h3>
          <p className="text-[12px] text-muted font-medium mt-0.5">Top contributors this month</p>
        </div>
        <Link href="/leaderboard" className="text-[12px] font-semibold text-[var(--brand-fg)] inline-flex items-center gap-1">
          View all <ArrowRight size={12} strokeWidth={2.2} />
        </Link>
      </div>
      {leaders.length === 0 ? (
        <p className="text-[13px] text-muted py-2">No points yet.</p>
      ) : (
        <ol className="space-y-2.5">
          {leaders.slice(0, 5).map((l, i) => {
            const podium = i === 0 ? 'amber' : i === 1 ? 'slate' : i === 2 ? 'rose' : null;
            return (
              <li key={l._id} className="flex items-center gap-3">
                <span
                  className={`h-7 w-7 grid place-items-center rounded-lg text-[11.5px] font-bold ${
                    podium === 'amber' ? 'bg-amber-100 text-amber-600' :
                    podium === 'slate' ? 'bg-slate-100 text-slate-500' :
                    podium === 'rose'  ? 'bg-rose-100  text-rose-600' :
                    'bg-slate-50 text-muted'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[13px] truncate font-medium">{l.resident?.name ?? 'Unknown'}</span>
                <span className="text-[13px] font-semibold tabular">{l.points}</span>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* ───────────────────── Bills table (resident) ───────────────────── */
function BillsTable({ bills }: { bills: Bill[] }) {
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3.5">
        <div>
          <h3 className="heading text-[15px]">Bills & Invoices</h3>
          <p className="text-[12px] text-muted font-medium mt-0.5">
            {bills.length || '5'} invoice{bills.length === 1 ? '' : 's'} · current statement
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-[12px] px-2.5 py-1.5"><Filter size={13} strokeWidth={2} /> Filter</button>
          <button className="btn-ghost text-[12px] px-2.5 py-1.5"><Download size={13} strokeWidth={2} /> Export</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafbfc' }}>
              {['Invoice', 'Amount', 'Status', 'Due Date', ''].map((h, i) => (
                <th
                  key={i}
                  className="text-[11px] font-semibold uppercase text-muted"
                  style={{
                    textAlign: i === 1 ? 'right' : 'left',
                    padding: i === 0 ? '10px 22px' : '10px 16px',
                    letterSpacing: '0.05em',
                    borderTop:    '1px solid #eef2f7',
                    borderBottom: '1px solid #eef2f7',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(bills.length ? bills : []).map((b, idx, arr) => (
              <tr
                key={b._id}
                className="hover:bg-slate-50/60 transition"
                style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9' }}
              >
                <td className="px-[22px] py-3.5">
                  <div className="text-[13.5px] font-semibold">{b.category}</div>
                  <div className="text-[11.5px] text-faint mt-0.5 flex gap-1.5">
                    <span className="font-mono text-[11px]">INV-{(b._id || '').slice(-6).toUpperCase()}</span>
                    <span>·</span>
                    <span>{b.dueDate ? new Date(b.dueDate).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'Current'}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right tabular text-[14px] font-semibold">
                  ₹{(+b.amount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3.5">
                  <BillStatus status={b.status} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-[12.5px] text-[var(--text-soft)] font-medium">
                    {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}
                  </div>
                  <div
                    className="text-[11px] mt-0.5 font-medium"
                    style={{ color: dueColor(b.dueDate) }}
                  >
                    {dueLabel(b.dueDate)}
                  </div>
                </td>
                <td className="px-[16px] py-3.5 pr-[22px] text-right">
                  {b.status?.toLowerCase() !== 'paid' ? (
                    <button className="btn-primary text-[12px] px-3 py-1.5">Pay now</button>
                  ) : (
                    <button className="btn-ghost text-[12px] px-2 py-1.5">
                      <Download size={12} strokeWidth={2} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {bills.length === 0 && (
              <tr>
                <td colSpan={5} className="px-[22px] py-10 text-center text-muted text-[13px]">
                  No bills to show yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BillStatus({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const map: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
    paid:    { label: 'Paid',    bg: '#ecfdf5', fg: '#059669', dot: '#10b981' },
    pending: { label: 'Pending', bg: '#fef3c7', fg: '#b45309', dot: '#f59e0b' },
    overdue: { label: 'Overdue', bg: '#fef2f2', fg: '#b91c1c', dot: '#ef4444' },
  };
  const m = map[s] ?? { label: status || 'Pending', bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md text-[11.5px] font-semibold"
      style={{ background: m.bg, color: m.fg, padding: '3px 9px 3px 8px' }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

/* ───────────────────── Admin / Guard tables ───────────────────── */
function ComplaintsTable({ complaints }: { complaints: Complaint[] }) {
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3.5">
        <div>
          <h3 className="heading text-[15px]">Recent Complaints</h3>
          <p className="text-[12px] text-muted font-medium mt-0.5">Latest issues submitted by residents</p>
        </div>
        <Link href="/admin/complaints" className="text-[12px] font-semibold text-[var(--brand-fg)] inline-flex items-center gap-1">
          View all <ArrowRight size={12} strokeWidth={2.2} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: '#fafbfc' }}>
              {['Title', 'Status', 'Submitted'].map((h, i) => (
                <th key={i} className="text-[11px] font-semibold uppercase text-muted text-left"
                    style={{ padding: i === 0 ? '10px 22px' : '10px 16px', letterSpacing: '0.05em',
                             borderTop: '1px solid #eef2f7', borderBottom: '1px solid #eef2f7' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {complaints.slice(0, 6).map((c, idx, arr) => (
              <tr key={c._id} className="hover:bg-slate-50/60 transition"
                  style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <td className="px-[22px] py-3.5 text-[13.5px] font-semibold">{c.title}</td>
                <td className="px-4 py-3.5"><BillStatus status={c.status} /></td>
                <td className="px-4 py-3.5 text-[12.5px] text-muted">{rel(c.createdAt)}</td>
              </tr>
            ))}
            {complaints.length === 0 && (
              <tr><td colSpan={3} className="px-[22px] py-10 text-center text-muted text-[13px]">No complaints yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function VisitorsTable({ visitors }: { visitors: Visitor[] }) {
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3.5">
        <div>
          <h3 className="heading text-[15px]">Recent Visitors</h3>
          <p className="text-[12px] text-muted font-medium mt-0.5">Logged at gate</p>
        </div>
        <Link href="/guard/visitors" className="text-[12px] font-semibold text-[var(--brand-fg)] inline-flex items-center gap-1">
          View all <ArrowRight size={12} strokeWidth={2.2} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: '#fafbfc' }}>
              {['Visitor', 'Purpose', 'Status', 'Time'].map((h, i) => (
                <th key={i} className="text-[11px] font-semibold uppercase text-muted text-left"
                    style={{ padding: i === 0 ? '10px 22px' : '10px 16px', letterSpacing: '0.05em',
                             borderTop: '1px solid #eef2f7', borderBottom: '1px solid #eef2f7' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visitors.slice(0, 6).map((v, idx, arr) => (
              <tr key={v._id} className="hover:bg-slate-50/60 transition"
                  style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <td className="px-[22px] py-3.5 text-[13.5px] font-semibold">{v.name}</td>
                <td className="px-4 py-3.5 text-[12.5px] text-muted">{v.purpose ?? '—'}</td>
                <td className="px-4 py-3.5"><BillStatus status={v.status} /></td>
                <td className="px-4 py-3.5 text-[12.5px] text-muted">{rel(v.createdAt)}</td>
              </tr>
            ))}
            {visitors.length === 0 && (
              <tr><td colSpan={4} className="px-[22px] py-10 text-center text-muted text-[13px]">No visitors logged.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ───────────────────── Helpers ───────────────────── */
function leaderPoints(rows: LeaderRow[], userId?: string): number | null {
  if (!userId) return null;
  const r = rows.find(x => x.resident?._id === userId);
  return r ? r.points : 0;
}
function visitorsToday(list: Visitor[]) {
  return list.filter(v => isToday(v.createdAt)).length;
}
function isToday(d?: string) {
  if (!d) return false;
  const x = new Date(d), t = new Date();
  return x.getDate() === t.getDate() && x.getMonth() === t.getMonth() && x.getFullYear() === t.getFullYear();
}
function rel(d?: string) {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(d).toLocaleDateString();
}
function trimLine(s: string, n: number) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
function dueLabel(d?: string) {
  if (!d) return '';
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  return `${days} days left`;
}
function dueColor(d?: string) {
  if (!d) return '#94a3b8';
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return '#dc2626';
  if (days <= 5) return '#b45309';
  return '#94a3b8';
}
function tilePlainBorder(tone: Tone) {
  const map: Record<Tone, string> = {
    blue: 'border-[1.5px] border-[#dbeafe]',
    teal: 'border-[1.5px] border-[#cffafe]',
    green: 'border-[1.5px] border-[#d1fae5]',
    amber: 'border-[1.5px] border-[#fef3c7]',
    violet: 'border-[1.5px] border-[#ede9fe]',
    slate: 'border-[1.5px] border-[#e2e8f0]',
    rose: 'border-[1.5px] border-[#fecaca]',
  };
  return map[tone];
}
function tileFg(tone: Tone) {
  const map: Record<Tone, string> = {
    blue: '#1d4ed8', teal: '#0d9488', green: '#059669',
    amber: '#b45309', violet: '#6d28d9', slate: '#475569', rose: '#b91c1c',
  };
  return map[tone];
}
