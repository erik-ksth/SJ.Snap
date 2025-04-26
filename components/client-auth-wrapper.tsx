'use client';

import { useSupabaseAuth } from '@/lib/context/supabase-auth-context';
import { ReactNode } from 'react';

interface ClientAuthWrapperProps {
     children: ReactNode;
}

export function ClientAuthWrapper({ children }: ClientAuthWrapperProps) {
     const { user } = useSupabaseAuth();
     const isLoggedIn = !!user;

     // Pass isLoggedIn as a prop to the global context
     return (
          <div data-is-logged-in={isLoggedIn}>
               {children}
          </div>
     );
} 