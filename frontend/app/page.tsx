"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function Home() {
  const { user, bootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (bootstrapping) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [user, bootstrapping, router]);

  return null;
}
