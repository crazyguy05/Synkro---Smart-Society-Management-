"use client";
import React from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import QrPassModal from './qr-pass-modal';
import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = deriveTitle(pathname);
  const greet = greeting();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const initials = (user?.name ?? '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'U';
  const firstName = user?.name?.split(/\s+/)[0] ?? 'there';

  return (
    <div className="min-h-screen grid grid-cols-[256px_1fr]">
      <Sidebar />
      <div className="flex flex-col min-h-screen min-w-0">
        <header
          className="sticky top-0 z-30 flex items-center gap-4 px-7 py-4 border-b border-[var(--border)]"
          style={{
            background: 'rgba(248,250,252,0.65)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          <div className="flex flex-col leading-tight">
            <div className="text-[11.5px] font-medium text-muted tracking-wide">{today}</div>
            <h1 className="heading text-[20px] mt-0.5">
              {greet}, <span>{firstName}</span>
            </h1>
          </div>

          {/* Search */}
          <div className="ml-6 search-bar flex-1 max-w-[420px]">
            <Search size={15} strokeWidth={2} />
            <input type="text" placeholder="Search bills, neighbours, listings…" />
            <kbd className="kbd">⌘K</kbd>
          </div>

          {/* Page title (derived) shown after search on wide screens */}
          <div className="hidden xl:flex items-center px-3 text-[13px] text-muted font-medium">
            <span className="opacity-60">·</span>
            <span className="ml-3">{title}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={17} strokeWidth={1.8} />
              <span
                className="absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full bg-[#ef4444]"
                style={{ boxShadow: '0 0 0 2px #F8FAFC' }}
              />
            </button>

            <QrPassModal />

            <ThemeToggle />

            <div className="w-px h-6 bg-[var(--border)] mx-1" />

            <button className="profile-pill">
              <div
                className="h-[30px] w-[30px] rounded-full grid place-items-center text-[11.5px] font-semibold text-white"
                style={{ backgroundImage: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' }}
              >
                {initials}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[12.5px] font-semibold">{user?.name ?? 'Resident'}</span>
                <span className="text-[10.5px] text-muted font-medium capitalize">{user?.role ?? 'guest'}</span>
              </div>
              <ChevronDown size={13} strokeWidth={2} className="text-muted" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-6 py-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
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
