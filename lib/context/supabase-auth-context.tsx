"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../supabase/supabase";

type SupabaseAuthContextType = {
     user: User | null;
     session: Session | null;
     loading: boolean;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
     user: null,
     session: null,
     loading: true,
});

export function SupabaseAuthProvider({
     children,
}: {
     children: React.ReactNode;
}) {
     const [user, setUser] = useState<User | null>(null);
     const [session, setSession] = useState<Session | null>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          // Get initial session
          const initializeAuth = async () => {
               const { data } = await supabase.auth.getSession();
               setSession(data.session);
               setUser(data.session?.user || null);
               setLoading(false);

               // Listen for auth changes
               const { data: authListener } = supabase.auth.onAuthStateChange(
                    (event, newSession) => {
                         setSession(newSession);
                         setUser(newSession?.user || null);
                         setLoading(false);
                    }
               );

               // Cleanup
               return () => {
                    authListener.subscription.unsubscribe();
               };
          };

          initializeAuth();
     }, []);

     return (
          <SupabaseAuthContext.Provider value={{ user, session, loading }}>
               {children}
          </SupabaseAuthContext.Provider>
     );
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext); 