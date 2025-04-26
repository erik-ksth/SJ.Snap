'use client';

import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to account page
    // If not logged in, redirect to report page
    if (!loading) {
      if (user) {
        router.push('/account');
      } else {
        router.push('/report');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth status
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Loading...</p>
      </div>
    </div>
  );
}
