"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const common = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: user?.role === 'resident' ? '/resident/complaints' : '/complaints', label: 'Complaints' },
    { href: user?.role === 'guard' ? '/guard/visitors' : user?.role === 'resident' ? '/resident/visitors' : '/visitors', label: 'Visitors' },
    { href: '/notices', label: 'Notices' },
    { href: '/help', label: 'Quick Help Hub' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/voting', label: 'Voting' },
    { href: '/meetings', label: 'Meetings' },
    { href: '/ai', label: 'AI Suggestion' },
  ];

  const adminOnly = [
    { href: '/admin/complaints', label: 'Complaints (Admin)' },
    { href: '/admin/visitors', label: 'Visitors (Admin)' },
    { href: '/admin/bills', label: 'Bills (Admin)' },
    { href: '/admin/voting', label: 'Voting (Admin)' },
    { href: '/admin/maintenance', label: 'Maintenance Calc' },
    { href: '/admin/marketplace', label: 'Marketplace (Admin)' },
    { href: '/admin', label: 'Admin' },
  ];

  const residentOnly = [
    { href: '/billing', label: 'Billing' },
    { href: '/resident/lost-found', label: 'Lost & Found' },
    { href: '/resident/marketplace', label: 'Marketplace' },
  ];

  const links = user?.role === 'admin'
    ? [...common, ...adminOnly]
    : [...common, ...residentOnly];

  return (
    <aside className={`h-screen ${collapsed ? 'w-[190px]' : 'w-60'} p-4 border-r border-white/10 sticky top-0 transition-all`}>
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className={`${collapsed ? 'text-base' : 'text-xl'} font-semibold leading-tight`}>
          Smart Society OS
        </h1>
        <button
          type="button"
          onClick={onToggle}
          className="px-2 py-1 rounded border border-white/10 hover:bg-white/5 text-xs"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '>>' : '<<'}
        </button>
      </div>
      <nav className="space-y-2">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`block px-3 py-2 rounded-md hover:bg-white/5 ${pathname?.startsWith(l.href) ? 'bg-white/10' : ''} ${collapsed ? 'text-sm' : ''}`}
            title={l.label}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

