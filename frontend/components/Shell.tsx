import React from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <Sidebar />
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-end">
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}
