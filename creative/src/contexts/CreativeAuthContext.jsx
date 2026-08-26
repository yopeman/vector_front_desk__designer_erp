import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const CreativeAuthContext = createContext();

export function useCreativeAuth() {
  return useContext(CreativeAuthContext);
}

export function CreativeAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isCreativeAdmin, setIsCreativeAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Check if user is creative admin
        await checkCreativeAdmin(session.user.id, session.user.email);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCreativeAdmin = async (userId, email) => {
    try {
      const { data } = await supabase
        .from('creative_admins')
        .select('*')
        .eq('email', email)
        .single();
      
      setIsCreativeAdmin(!!data && data.is_active);
    } catch (error) {
      console.error('Creative admin check error:', error);
      setIsCreativeAdmin(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setUser(data.user);
    await checkCreativeAdmin(data.user.id, data.user.email);
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setIsCreativeAdmin(false);
  };

  const value = {
    user,
    isCreativeAdmin,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    canEdit: isCreativeAdmin, // Admins can edit everything
    canDelete: isCreativeAdmin, // Only admins can delete
    canApprove: isCreativeAdmin, // Only admins can approve
  };

  return <CreativeAuthContext.Provider value={value}>{children}</CreativeAuthContext.Provider>;
}

export default CreativeAuthContext;
