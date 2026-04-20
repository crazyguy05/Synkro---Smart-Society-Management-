"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Receipt, Megaphone, Trophy, UserCheck, MessageSquareWarning, Store, Search, Vote,
  Calendar, ShieldCheck, Sparkles, ArrowRight, TrendingUp, AlertTriangle, LifeBuoy,
} from 'lucide-react';
import Shell from '../../components/Shell';
import PanicButton from '../../components/PanicButton';
import Card from '../../components/ui/Card';
import Badge, { statusTone } from '../../components/ui/Badge';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

type Bill = { _id: string; amount: number; status: string; category: string; dueDate?: string; };
type Notice = { _id: string; title: string; body: string; createdAt: string };
type Visitor = { _id: string; name: string; purpose?: string; status: string; createdAt: string };
type Complaint = { _id: string; title: string; status: string; createdAt: string };
type LeaderRow = { _id: string; resident?: { _id: string; name: string; apartment?: string }; points: number; badges?: string[] };

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
  const pendingVisitors = myVisitors.filter(v => /pending/i.test(v.status));
  const openComplaints = complaints.filter(c => !/resolved/i.test(c.status));

  return (
    <Shell>
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden card p-6 sm:p-8"
      >
        <div className="absolute inset-0 bg-aurora opacity-50 animate-gradient [background-size:200%_200%]" />
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h2 className="heading text-2xl sm:text-3xl mt-1">
              Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'there'}</span>
            </h2>
            <p className="text-sm text-muted mt-1">
              Signed in as <span className="capitalize font-medium">{user?.role}</span>.
            </p>
          </div>
          <PanicButton />
        </div>
      </motion.div>

      {/* Role-specific stats */}
      {user?.role === 'resident' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Receipt size={18} />} label="Amount Due" value={`₹${unpaidTotal.toLocaleString('en-IN')}`} tone="brand" />
          <StatCard icon={<UserCheck size={18} />} label="Visitor Requests" value={pendingVisitors.length} tone="amber" href="/resident/visitors" />
          <StatCard icon={<MessageSquareWarning size={18} />} label="Open Complaints" value={openComplaints.length} tone="rose" href="/resident/complaints" />
          <StatCard icon={<Trophy size={18} />} label="Green Points" value={leaderPoints(leaders, user.id) ?? 0} tone="emerald" href="/leaderboard" />
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<MessageSquareWarning size={18} />} label="Open Complaints" value={openComplaints.length} tone="amber" href="/admin/complaints" />
          <StatCard icon={<UserCheck size={18} />} label="Visitors Today" value={visitorsToday(allVisitors)} tone="brand" href="/admin/visitors" />
          <StatCard icon={<Megaphone size={18} />} label="Active Notices" value={notices.length} tone="violet" href="/notices" />
          <StatCard icon={<TrendingUp size={18} />} label="Residents" value={leaders.length} tone="emerald" />
        </div>
      )}

      {user?.role === 'guard' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={<UserCheck size={18} />} label="Pending" value={allVisitors.filter(v => /pending/i.test(v.status)).length} tone="amber" href="/guard/visitors" />
          <StatCard icon={<ShieldCheck size={18} />} label="Approved Today" value={allVisitors.filter(v => /approved|allowed/i.test(v.status) && isToday(v.createdAt)).length} tone="emerald" />
          <StatCard icon={<AlertTriangle size={18} />} label="Rejected" value={allVisitors.filter(v => /rejected|denied/i.test(v.status)).length} tone="rose" />
        </div>
      )}

      {/* Main two-column grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Latest notices */}
          <Card>
            <SectionHeader icon={<Megaphone size={16} />} title="Latest Notices" href="/notices" />
            {notices.length === 0 ? (
              <p className="text-sm text-muted py-4">No notices yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {notices.slice(0, 4).map(n => (
                  <li key={n._id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-sm">{n.title}</div>
                        <p className="text-sm text-muted line-clamp-2 mt-0.5">{n.body}</p>
                      </div>
                      <span className="text-[11px] text-muted whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent activity depending on role */}
          {user?.role === 'resident' && (
            <Card>
              <SectionHeader icon={<Receipt size={16} />} title="Recent Bills" href="/billing" />
              {bills.length === 0 ? (
                <p className="text-sm text-muted py-4">No bills to show.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {bills.slice(0, 4).map(b => (
                    <li key={b._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{b.category}</div>
                        <div className="text-xs text-muted">{b.dueDate ? `Due ${new Date(b.dueDate).toLocaleDateString()}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">₹{(+b.amount).toLocaleString('en-IN')}</span>
                        <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {user?.role === 'admin' && (
            <Card>
              <SectionHeader icon={<MessageSquareWarning size={16} />} title="Recent Complaints" href="/admin/complaints" />
              {complaints.length === 0 ? (
                <p className="text-sm text-muted py-4">No complaints yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {complaints.slice(0, 5).map(c => (
                    <li key={c._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{c.title}</div>
                        <div className="text-xs text-muted">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                      <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {user?.role === 'guard' && (
            <Card>
              <SectionHeader icon={<UserCheck size={16} />} title="Recent Visitors" href="/guard/visitors" />
              {allVisitors.length === 0 ? (
                <p className="text-sm text-muted py-4">No visitors logged.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {allVisitors.slice(0, 5).map(v => (
                    <li key={v._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{v.name}</div>
                        <div className="text-xs text-muted">{v.purpose ?? 'Visit'}</div>
                      </div>
                      <Badge tone={statusTone(v.status)}>{v.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Leaderboard preview */}
          <Card>
            <SectionHeader icon={<Trophy size={16} />} title="Green Leaders" href="/leaderboard" />
            {leaders.length === 0 ? (
              <p className="text-sm text-muted py-4">No points yet.</p>
            ) : (
              <ol className="space-y-2.5">
                {leaders.slice(0, 5).map((l, i) => (
                  <li key={l._id} className="flex items-center gap-3">
                    <span
                      className={`h-7 w-7 grid place-items-center rounded-lg text-xs font-bold ${
                        i === 0 ? 'bg-amber-500/20 text-amber-400' :
                        i === 1 ? 'bg-slate-400/20 text-slate-300' :
                        i === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-white/5 text-muted'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm truncate">{l.resident?.name ?? 'Unknown'}</span>
                    <span className="text-sm font-semibold">{l.points}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <SectionHeader icon={<Sparkles size={16} />} title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2">
              <QuickAction href="/help" icon={<LifeBuoy size={16} />} label="Emergency" />
              <QuickAction href="/meetings" icon={<Calendar size={16} />} label="Meetings" />
              <QuickAction href="/polls" icon={<Vote size={16} />} label="Vote" />
              {user?.role === 'resident' && (
                <>
                  <QuickAction href="/ai" icon={<Sparkles size={16} />} label="AI Mediator" />
                  <QuickAction href="/resident/lost-found" icon={<Search size={16} />} label="Lost & Found" />
                  <QuickAction href="/resident/marketplace" icon={<Store size={16} />} label="Marketplace" />
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <QuickAction href="/ai" icon={<Sparkles size={16} />} label="AI Triage" />
                  <QuickAction href="/admin/bills" icon={<Receipt size={16} />} label="Bills" />
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function SectionHeader({ icon, title, href }: { icon?: React.ReactNode; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-brand-400">{icon}</span>
        <h3 className="heading text-base">{title}</h3>
      </div>
      {href && (
        <Link href={href} className="text-xs text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, tone, href,
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode;
  tone: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet'; href?: string;
}) {
  const toneBg: Record<string, string> = {
    brand: 'bg-brand-500/10 text-brand-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    violet: 'bg-violet-500/10 text-violet-400',
  };
  const body = (
    <>
      <div className="flex items-center justify-between">
        <div className={`h-9 w-9 rounded-xl grid place-items-center ${toneBg[tone]}`}>{icon}</div>
        {href && <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition" />}
      </div>
      <div className="mt-3">
        <div className="text-xs text-muted">{label}</div>
        <div className="heading text-2xl mt-0.5">{value}</div>
      </div>
    </>
  );
  const cls = 'group card p-4 transition hover:-translate-y-0.5 hover:shadow-glow block';
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card-muted)] hover:border-brand-500/40 hover:shadow-glow transition text-sm"
    >
      <span className="text-brand-400">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

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
  const x = new Date(d);
  const t = new Date();
  return x.getDate() === t.getDate() && x.getMonth() === t.getMonth() && x.getFullYear() === t.getFullYear();
}
