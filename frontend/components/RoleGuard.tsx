"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, Role } from '../lib/auth';
import { ShieldOff } from 'lucide-react';

export default function RoleGuard({
  roles,
  children,
  fallback,
}: {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, bootstrapping } = useAuth();
  const router = useRouter();
  const allowed = !!user && roles.includes(user.role);

  useEffect(() => {
    if (bootstrapping || !user) return;
    if (!allowed) {
      const t = setTimeout(() => router.replace('/dashboard'), 1200);
      return () => clearTimeout(t);
    }
  }, [bootstrapping, user, allowed, router]);

  if (bootstrapping || !user) return null; // AuthGate handles loader
  if (!allowed) {
    return (
      fallback ?? (
        <div className="min-h-[60vh] grid place-items-center p-6">
          <div className="card p-8 max-w-md text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-400 grid place-items-center">
              <ShieldOff size={24} />
            </div>
            <h3 className="heading text-lg">Access restricted</h3>
            <p className="text-sm text-muted">
              This page is only available to: <span className="font-medium capitalize">{roles.join(', ')}</span>.
              Redirecting you to your dashboard…
            </p>
          </div>
        </div>
      )
    );
  }
  return <>{children}</>;
}
