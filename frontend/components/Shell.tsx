"use client";
import React from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = deriveTitle(pathname);

  return (
    <div className="min-h-screen grid grid-cols-[256px_1fr]">
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-4 px-6 border-b border-[var(--border)] bg-[var(--bg-elev)]/70 backdrop-blur-xl">
          <h1 className="heading text-xl">{title}</h1>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-rose animate-pulse" />
            </button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}

function deriveTitle(pathname: string | null): string {
  if (!pathname) return 'Dashboard';
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return 'Dashboard';
  const last = segs[segs.length - 1];
  const map: Record<string, string> = {
    dashboard: 'Dashboard', complaints: 'Complaints', visitors: 'Visitors',
    notices: 'Notices', polls: 'Polls', leaderboard: 'Green Points',
    ai: 'AI Suggestions', bills: 'Bills', billing: 'Billing',
    'lost-found': 'Lost & Found', marketplace: 'Marketplace',
    meetings: 'Meetings', admin: 'Admin', resident: 'Resident',
    guard: 'Guard', login: 'Sign In',
  };
  return map[last] ?? last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
