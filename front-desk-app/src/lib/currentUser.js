import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';

export async function getCurrentUserId() {
  const { data: adminData } = await supabaseAdmin.auth.getUser();
  if (adminData?.user) return adminData.user.id;
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}