import './globals.css';
import React from 'react';
import { AuthProvider } from '../lib/auth';

export const metadata = {
  title: 'Smart Society OS',
  description: 'Smart housing management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
