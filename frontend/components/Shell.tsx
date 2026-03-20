"use client";
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import QrPassModal from './qr-pass-modal';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className={`min-h-screen grid ${collapsed ? 'grid-cols-[190px_1fr]' : 'grid-cols-[240px_1fr]'}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-end gap-2">
          <QrPassModal />
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}
