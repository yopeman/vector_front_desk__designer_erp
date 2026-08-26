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

  const ensureUserInUsersTable = async (authUser) => {
    try {
      // Check if user exists in users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking user in users table:', checkError);
        return;
      }

      // If user doesn't exist, create them
      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            username: authUser.email?.split('@')[0] || authUser.user_metadata?.full_name || 'User',
            role: 'designer'
          });

        if (insertError) {
          console.error('Error creating user in users table:', insertError);
        } else {
          console.log('User created in users table:', authUser.email);
        }
      }
    } catch (error) {
      console.error('Error ensuring user in users table:', error);
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Ensure user exists in users table
        await ensureUserInUsersTable(session.user);
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
    // Ensure user exists in users table
    await ensureUserInUsersTable(data.user);
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
