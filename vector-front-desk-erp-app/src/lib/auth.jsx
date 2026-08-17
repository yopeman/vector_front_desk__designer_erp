import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { checkLocation } from './location';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('users')
      .select('*, departments(name)')
      .eq('id', userId)
      .maybeSingle();

    // If no profile exists yet, auto-create one from the auth user's email
    if (!data) {
      const { data: authUser } = await supabase.auth.getUser();
      const email = authUser?.user?.email || 'unknown@email.com';
      const username = email.split('@')[0];

      const { data: newProfile, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: username,
          email: email,
          role: null,
        })
        .select('*, departments(name)')
        .single();

      if (!error && newProfile) {
        setProfile(newProfile);
        return newProfile;
      }
    }

    setProfile(data || null);
    return data || null;
  }

  async function signIn(email, password) {
    // Check location first
    const locationResult = await checkLocation();
    if (!locationResult.success) {
      throw new Error(locationResult.error || 'Location check failed');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUp(email, password, username) {
    // Sign up via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    // Create user profile with role = null (pending approval)
    if (authData.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        username: username,
        email: email,
        role: null,
      });
      if (profileError) throw profileError;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.role === 'admin',
    isDesigner: profile?.role === 'designer',
    isFrontDesk: profile?.role === 'front_desk',
    role: profile?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}