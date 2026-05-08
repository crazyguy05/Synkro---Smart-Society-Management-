"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard, MessageSquareWarning, UserCheck, Megaphone, Vote, Trophy, Sparkles,
  Receipt, Search, Store, Calendar, ShieldCheck, LogOut, Building2, LifeBuoy, Settings, Leaf, ArrowRight,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const role = user?.role;

  const common: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/notices', label: 'Notices', icon: Megaphone },
    { href: '/polls', label: 'Polls', icon: Vote },
    { href: '/meetings', label: 'Meetings', icon: Calendar },
    { href: '/leaderboard', label: 'Green Points', icon: Trophy },
    { href: '/help', label: 'Help & Emergency', icon: LifeBuoy },
  ];

  const byRole: Record<string, NavItem[]> = {
    resident: [
      { href: '/resident/complaints', label: 'Complaints', icon: MessageSquareWarning },
      { href: '/resident/visitors', label: 'Visitors', icon: UserCheck },
      { href: '/amenities', label: 'Amenities', icon: Building2 },
      { href: '/billing', label: 'Billing', icon: Receipt },
      { href: '/resident/lost-found', label: 'Lost & Found', icon: Search },
      { href: '/resident/marketplace', label: 'Marketplace', icon: Store },
      { href: '/ai', label: 'AI Mediator', icon: Sparkles },
    ],
    admin: [
      { href: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
      { href: '/admin/visitors', label: 'Visitors', icon: UserCheck },
      { href: '/admin/bills', label: 'Bills', icon: Receipt },
      { href: '/admin/polls', label: 'Manage Polls', icon: Vote },
      { href: '/admin/amenities', label: 'Amenities', icon: Building2 },
      { href: '/admin/residents', label: 'Residents', icon: UserCheck },
      { href: '/admin/marketplace', label: 'Marketplace', icon: Store },
      { href: '/ai', label: 'AI Suggest', icon: Sparkles },
    ],
    guard: [
      { href: '/guard/visitors', label: 'Visitor Entry', icon: ShieldCheck },
    ],
    staff: [
      { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
    ],
  };

  const roleItems = role ? byRole[role] ?? [] : [];

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="sticky top-0 h-screen w-64 flex flex-col glass border-y-0 border-l-0 border-r border-[var(--border)] rounded-none">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5 px-1">
          <div
            className="grid place-items-center h-9 w-9 rounded-[10px] text-white shadow-brand-soft"
            style={{ backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}
          >
            <Building2 size={18} />
          </div>
          <div className="leading-tight">
            <div className="heading text-[15px] text-[var(--text)]">Synkro</div>
            <div className="text-[11px] text-muted font-medium">Cedarwood Heights</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        <div className="px-2 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted font-semibold">General</div>
        {common.map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {roleItems.length > 0 && (
          <>
            <div className="px-2 pt-4 pb-1.5 text-[10px] uppercase tracking-wider text-muted font-semibold">
              {role === 'admin' ? 'Admin' : role === 'guard' ? 'Guard' : role === 'staff' ? 'Staff' : 'Resident'}
            </div>
            {roleItems.map(item => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      {/* Eco / Earth Week card */}
      <div className="px-4 pt-2">
        <div
          className="relative overflow-hidden rounded-2xl p-3.5 border"
          style={{
            background: 'linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%)',
            borderColor: '#cffafe',
          }}
        >
          <Leaf size={64} className="absolute -top-2.5 -right-2.5 opacity-25" color="#0d9488" strokeWidth={1.4} />
          <div className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: '#0d9488' }}>Earth Week</div>
          <div className="text-[12.5px] mt-1.5 font-medium leading-snug text-[#0f172a]">
            Earn 2× points on composting through Apr 30
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 mt-2.5 text-[12px] font-semibold"
            style={{ color: '#0d9488' }}
          >
            Track progress <ArrowRight size={12} strokeWidth={2.2} />
          </Link>
        </div>

        <div className="flex gap-1.5 mt-3 px-1">
          <FootLink href="#" icon={<Settings size={14} strokeWidth={1.9} />} label="Settings" />
          <FootLink href="/help" icon={<LifeBuoy size={14} strokeWidth={1.9} />} label="Help" />
        </div>
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        {user ? (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div
              className="h-9 w-9 rounded-full grid place-items-center text-sm font-semibold text-white"
              style={{ backgroundImage: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' }}
            >
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold truncate text-[var(--text)]">{user.name}</div>
              <div className="text-[11px] text-muted capitalize">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-[var(--text-muted)] hover:text-rose-600 transition"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`link-row ${active ? 'link-row-active' : ''}`}>
      <Icon
        size={17}
        className={active ? '' : 'text-[var(--text-muted)]'}
        {...(active ? { color: '#0d9488' } as { color?: string } : {})}
      />
      <span className="flex-1">{item.label}</span>
      {item.badge != null && (
        <span
          className="text-[10.5px] font-semibold rounded-full min-w-[18px] text-center px-1.5"
          style={{
            background: active ? '#0d9488' : '#e2e8f0',
            color: active ? '#fff' : '#475569',
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function FootLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11.5px] text-[var(--text-muted)] font-medium rounded-md hover:bg-[var(--card-muted)] transition"
    >
      {icon} {label}
    </Link>
  );
}
