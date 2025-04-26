'use client';

import { useAuth } from '@/lib/context/auth-context';

export default function ReportPage() {
     const { user, loading } = useAuth();

     return (
          <div className="container mx-auto px-4 py-8">
               <h1 className="text-2xl font-bold mb-6">Report</h1>

               {!user && !loading && (
                    <div className="p-4 mb-6 bg-yellow-100 text-yellow-800 rounded">
                         Please <a className="underline" href="/login">log in</a> to access all features.
                    </div>
               )}

               <div className="p-6 border rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Report Feature Coming Soon</h2>
                    <p className="text-gray-600">
                         This is a placeholder for the report feature. The report functionality will be built here.
                    </p>
               </div>
          </div>
     );
} 