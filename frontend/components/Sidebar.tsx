"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard, MessageSquareWarning, UserCheck, Megaphone, Vote, Trophy, Sparkles,
  Receipt, Search, Store, Calendar, ShieldCheck, LogOut, Building2, LifeBuoy,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; roles?: string[] };

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
    <aside className="h-screen w-64 sticky top-0 border-r border-[var(--border)] bg-[var(--bg-elev)]/70 backdrop-blur-xl flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet grid place-items-center shadow-glow">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <div className="heading text-base leading-tight">Synkro</div>
            <div className="text-[10px] text-muted tracking-wider uppercase">Society OS</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted">General</div>
        {common.map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {roleItems.length > 0 && (
          <>
            <div className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-wider text-muted">
              {role === 'admin' ? 'Admin' : role === 'guard' ? 'Guard' : role === 'staff' ? 'Staff' : 'Resident'}
            </div>
            {roleItems.map(item => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-[var(--border)]">
        {user ? (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet grid place-items-center text-sm font-semibold text-white">
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[11px] text-muted capitalize">{user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 transition"
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
    <Link
      href={item.href}
      className={`link-row ${active ? 'link-row-active' : ''}`}
    >
      <Icon size={17} className={active ? 'text-brand-400' : ''} />
      <span>{item.label}</span>
    </Link>
  );
}
