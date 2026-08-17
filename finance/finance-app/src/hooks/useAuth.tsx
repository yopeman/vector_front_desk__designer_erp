import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { financeClient } from '../services/supabaseClients';
import { User } from '@supabase/supabase-js';
import { checkLocation } from '../utils/location';

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
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

  const signIn = async (email: string, password: string) => {
    // Check location first
    const locationResult = await checkLocation();
    if (!locationResult.success) {
      throw new Error(locationResult.error || 'Location check failed');
    }

    const { error } = await financeClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data: authData, error: authError } = await financeClient.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await financeClient.from('users').insert({
        id: authData.user.id,
        username: username,
        email: email,
        role: null,
      });
      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    await financeClient.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ profile, user, loading, signIn, signUp, signOut }}>
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
