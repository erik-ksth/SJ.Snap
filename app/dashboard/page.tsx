'use client';

import { useSupabaseAuth } from '@/lib/context/supabase-auth-context';

export default function DashboardPage() {
     const { user, loading } = useSupabaseAuth();
     return (
          <div className="container mx-auto px-4 py-8">
               <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

               {!user && !loading ? (
                    <div className="p-4 mb-6 bg-yellow-100 text-yellow-800 rounded">
                         Please <a className="underline" href="/login">log in</a> to access all features.
                    </div>
               ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="border rounded-lg p-6 shadow-sm">
                              <h2 className="text-xl font-semibold mb-4">My Reports</h2>
                              <p className="text-gray-600">You haven&apos;t submitted any reports yet.</p>
                         </div>

                         <div className="border rounded-lg p-6 shadow-sm">
                              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                              <p className="text-gray-600">No recent activity to display.</p>
                         </div>
                    </div>
               )}
          </div>
     );
} 