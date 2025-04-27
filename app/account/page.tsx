'use client';

import { useSupabaseAuth } from '@/lib/context/supabase-auth-context';
import { signOut } from '@/lib/supabase/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function AccountPage() {
     const { user, loading } = useSupabaseAuth();
     const router = useRouter();
     const [firstName, setFirstName] = useState('');
     const [lastName, setLastName] = useState('');
     const [memberSince, setMemberSince] = useState<string | null>(null);

     useEffect(() => {
          // If not logged in and not loading, redirect to login
          if (!loading && !user) {
               router.push('/login');
          }

          // Parse name from user metadata if available
          if (user?.user_metadata?.full_name) {
               const fullName = user.user_metadata.full_name;
               const nameParts = fullName.split(' ');
               setFirstName(nameParts[0] || '');
               setLastName(nameParts.slice(1).join(' ') || '');
          }

          // Get created_at timestamp
          if (user?.created_at) {
               setMemberSince(new Date(user.created_at).toLocaleDateString());
          }
     }, [user, loading, router]);

     const handleSignOut = async () => {
          await signOut();
          router.push('/login');
     };

     // Show loading state
     if (loading) {
          return (
               <div className="container mx-auto px-4 py-8 text-center">
                    <p>Loading...</p>
               </div>
          );
     }

     // Show message if not logged in (though they should be redirected)
     if (!user) {
          return (
               <div className="container mx-auto px-4 py-8">
                    <p>Please log in to view your account</p>
               </div>
          );
     }

     return (
          <div className="container mx-auto px-4 py-8 max-w-3xl">
               <h1 className="text-2xl font-bold mb-6">My Account</h1>

               <div className="p-6 border rounded-lg shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                         {user.user_metadata?.avatar_url && (
                              <div className="relative w-24 h-24 rounded-full overflow-hidden">
                                   <Image
                                        src={user.user_metadata.avatar_url}
                                        alt="Profile"
                                        className="object-cover"
                                        fill
                                   />
                              </div>
                         )}

                         <div className="flex-1 w-full">
                              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                             First Name
                                        </label>
                                        <div className="text-gray-800 font-medium">
                                             {firstName || 'Not available'}
                                        </div>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                             Last Name
                                        </label>
                                        <div className="text-gray-800 font-medium">
                                             {lastName || 'Not available'}
                                        </div>
                                   </div>

                                   <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-500 mb-1">
                                             Email Address
                                        </label>
                                        <div className="text-gray-800 font-medium">
                                             {user.email || 'Not available'}
                                        </div>
                                   </div>

                                   {memberSince && (
                                        <div className="md:col-span-2">
                                             <label className="block text-sm font-medium text-gray-500 mb-1">
                                                  Member Since
                                             </label>
                                             <div className="text-gray-600 text-sm">
                                                  {memberSince}
                                             </div>
                                        </div>
                                   )}
                              </div>
                         </div>
                    </div>
               </div>

               <div className="p-6 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Account Management</h2>

                    <div className="space-y-4">
                         <p className="text-gray-600">
                              Use the button below to sign out of your account.
                         </p>

                         <button
                              onClick={handleSignOut}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                         >
                              Sign Out
                         </button>
                    </div>
               </div>
          </div>
     );
} 