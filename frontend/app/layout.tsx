import './globals.css';
import React from 'react';
import { AuthProvider } from '../lib/auth';
import AuthGate from '../components/AuthGate';

export const metadata = {
  title: 'Synkro — Smart Society OS',
  description: 'Residential society management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
