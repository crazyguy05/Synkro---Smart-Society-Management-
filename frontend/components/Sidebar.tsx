"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const common = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: user?.role === 'resident' ? '/resident/complaints' : '/complaints', label: 'Complaints' },
    { href: user?.role === 'guard' ? '/guard/visitors' : user?.role === 'resident' ? '/resident/visitors' : '/visitors', label: 'Visitors' },
    { href: '/notices', label: 'Notices' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/ai', label: 'AI Suggestion' },
  ];

  const adminOnly = [
    { href: '/admin/complaints', label: 'Complaints (Admin)' },
    { href: '/admin/visitors', label: 'Visitors (Admin)' },
    { href: '/admin/bills', label: 'Bills (Admin)' },
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
    <aside className="h-screen w-60 p-4 border-r border-white/10 sticky top-0">
      <h1 className="text-xl font-semibold mb-6">Smart Society OS</h1>
      <nav className="space-y-2">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`block px-3 py-2 rounded-md hover:bg-white/5 ${pathname?.startsWith(l.href) ? 'bg-white/10' : ''}`}>
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

