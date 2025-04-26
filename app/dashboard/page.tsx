'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
     const { user, loading } = useAuth();
     const router = useRouter();

     useEffect(() => {
          if (!loading && !user) {
               router.push('/login');
          }
     }, [user, loading, router]);

     // Show loading state
     if (loading) {
          return (
               <div className="container mx-auto px-4 py-8 text-center">
                    <p>Loading...</p>
               </div>
          );
     }

     // Show login prompt if not logged in
     if (!user) {
          return (
               <div className="container mx-auto px-4 py-8">
                    <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
                         Please <a className="underline" href="/login">log in</a> to view this page.
                    </div>
               </div>
          );
     }

     return (
          <div className="container mx-auto px-4 py-8">
               <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

               <div className="p-6 border rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Welcome to your dashboard</h2>
                    <p className="text-gray-600">
                         This is a placeholder for the dashboard. Future features will be built here.
                    </p>
               </div>
          </div>
     );
} 