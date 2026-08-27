import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { checkLocation } from './location';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session from both clients
    Promise.all([
      supabase.auth.getSession(),
      supabaseAdmin.auth.getSession()
    ]).then(([{ data: { session: regularSession } }, { data: { session: adminSession } }]) => {
      // Prioritize admin session if it exists
      if (adminSession?.user) {
        setUser(adminSession.user);
        fetchProfile(adminSession.user.id);
      } else if (regularSession?.user) {
        setUser(regularSession.user);
        fetchProfile(regularSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes from both clients
    const { data: regularListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only process if admin session doesn't exist
        const { data: adminSession } = await supabaseAdmin.auth.getSession();
        if (!adminSession?.session) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
        setLoading(false);
      }
    );

    const { data: adminListener } = supabaseAdmin.auth.onAuthStateChange(
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

    return () => {
      regularListener?.subscription.unsubscribe();
      adminListener?.subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId) {
    // Check which client has the active session
    const { data: adminSession } = await supabaseAdmin.auth.getSession();
    const activeClient = adminSession?.session ? supabaseAdmin : supabase;

    const { data } = await activeClient
      .from('users')
      .select('*, departments(name)')
      .eq('id', userId)
      .maybeSingle();

    // If no profile exists yet, auto-create one from the auth user's email
    if (!data) {
      const { data: authUser } = await activeClient.auth.getUser();
      const email = authUser?.user?.email || 'unknown@email.com';
      const username = email.split('@')[0];

      const { data: newProfile, error } = await activeClient
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

    // First, try to sign in with regular client to check role
    const { data: regularData, error: regularError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (regularError) throw regularError;

    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', regularData.user.id)
      .maybeSingle();

    // If user is admin, sign out from regular client and sign in with admin client
    if (profile?.role === 'admin') {
      await supabase.auth.signOut();
      
      const { error: adminError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });
      
      if (adminError) throw adminError;
      
      // Set user from admin session
      const { data: adminSession } = await supabaseAdmin.auth.getSession();
      if (adminSession?.session?.user) {
        setUser(adminSession.session.user);
        await fetchProfile(adminSession.session.user.id);
      }
    }
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
    // Sign out from both clients
    await supabase.auth.signOut();
    await supabaseAdmin.auth.signOut();
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