"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';

export default function LegacyComplaintsRedirect() {
  const { user, bootstrapping } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (bootstrapping || !user) return;
    if (user.role === 'admin') router.replace('/admin/complaints');
    else if (user.role === 'resident') router.replace('/resident/complaints');
    else router.replace('/dashboard');
  }, [user, bootstrapping, router]);
  return null;
}
