"use client";
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { Building2 } from 'lucide-react';

const PUBLIC_PATHS = ['/login'];

function isPublic(pathname: string | null) {
  if (!pathname) return false;
  if (pathname === '/') return true;
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, bootstrapping } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const pub = isPublic(pathname);

  useEffect(() => {
    if (bootstrapping) return;
    if (!pub && !user) router.replace('/login');
  }, [bootstrapping, user, pub, router]);

  if (pub) return <>{children}</>;

  if (bootstrapping || !user) {
    return <BootLoader />;
  }

  return <>{children}</>;
}

function BootLoader() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet blur-xl opacity-60 animate-pulse" />
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet grid place-items-center shadow-glow">
            <Building2 size={26} className="text-white" />
          </div>
        </div>
        <div className="text-sm text-muted">Loading Synkro…</div>
      </div>
    </div>
  );
}
