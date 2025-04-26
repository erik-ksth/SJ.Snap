'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getUserData } from '../firebase/auth';
import { Timestamp } from 'firebase/firestore';

type UserData = {
     uid: string;
     email: string | null;
     displayName: string | null;
     photoURL: string | null;
     createdAt: Timestamp;
};

type AuthContextType = {
     user: User | null;
     userData: UserData | null;
     loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
     user: null,
     userData: null,
     loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
     const [user, setUser] = useState<User | null>(null);
     const [userData, setUserData] = useState<UserData | null>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          // Check if we're in a browser environment
          if (typeof window === 'undefined') {
               setLoading(false);
               return;
          }

          const unsubscribe = onAuthStateChanged(auth, async (user) => {
               setUser(user);

               if (user) {
                    try {
                         // Fetch user data from Firestore
                         const result = await getUserData(user.uid);
                         if (result.success) {
                              setUserData(result.data as UserData);
                         }
                    } catch (error) {
                         console.error('Error fetching user data:', error);
                         // If we can't get user data, still allow auth to work with just the basic user info
                    }
               } else {
                    setUserData(null);
               }

               setLoading(false);
          });

          return () => unsubscribe();
     }, []);

     return (
          <AuthContext.Provider value={{ user, userData, loading }}>
               {children}
          </AuthContext.Provider>
     );
}; 