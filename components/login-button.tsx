'use client';

import { useAuth } from '@/lib/context/auth-context';
import Link from 'next/link';

export function LoginButton() {
     const { user } = useAuth();
     const isLoggedIn = !!user;

     return isLoggedIn ? (
          <Link href="/account" className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-100">
               <span className="hidden sm:inline">Account</span>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
          </Link>
     ) : (
          <Link href="/login" className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-100">
               <span className="hidden sm:inline">Login</span>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
               </svg>
          </Link>
     );
} 