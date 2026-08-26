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
        // All authenticated users have admin privileges
        setIsCreativeAdmin(true);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setUser(data.user);
    setIsCreativeAdmin(true);
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
