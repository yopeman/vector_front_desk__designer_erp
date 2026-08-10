import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { financeClient } from '../services/supabaseClients';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  profile: Profile | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: currentUser } } = await financeClient.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          const { data: profileData } = await financeClient
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = financeClient.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          const { data: profileData } = await financeClient
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ profile, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
