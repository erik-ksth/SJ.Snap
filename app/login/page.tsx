'use client';

import { useState, useEffect } from 'react';
import { signInWithGoogle } from '@/lib/supabase/supabase';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { useSupabaseAuth } from '@/lib/context/supabase-auth-context';

export default function LoginPage() {
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState('');
     const router = useRouter();
     const { user } = useSupabaseAuth();

     // Redirect if user is already logged in
     useEffect(() => {
          if (user) {
               router.push('/report');
          }
     }, [user, router]);

     const handleGoogleSignIn = async () => {
          setLoading(true);
          setError('');

          try {
               const { error } = await signInWithGoogle();

               if (error) {
                    setError(error.message || 'An error occurred during sign in');
               }
               // The redirection is handled by the OAuth callback
          } catch (err: unknown) {
               console.log('Sign in error:', err);
               const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

               // Check if this is a network error
               if (errorMessage.includes('offline') || errorMessage.includes('network')) {
                    setError('Network error: Please check your internet connection and try again.');
               } else {
                    setError(errorMessage);
               }
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="container mx-auto px-4 py-8 max-w-md">
               <h1 className="text-2xl font-bold mb-6 text-center">Login / Register</h1>

               <div className="p-6 border rounded-lg shadow-sm">
                    {error && (
                         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                              {error}
                         </div>
                    )}

                    <div className="text-center mb-6">
                         <p className="mb-4 text-gray-600">
                              Sign in or register with your Google account
                         </p>

                         <button
                              onClick={handleGoogleSignIn}
                              disabled={loading}
                              className="w-full flex justify-center items-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-md transition-colors"
                         >
                              <FcGoogle className="text-xl" />
                              <span>{loading ? 'Processing...' : 'Continue with Google'}</span>
                         </button>
                    </div>
               </div>
          </div>
     );
} 