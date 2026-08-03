// Supabase client for Machine Operation ERP (vanilla JS)
window.SUPABASE_URL = 'http://127.0.0.1:54321';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

window.supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// Helper function to get current user
async function getCurrentUser() {
    const { data: { user }, error } = await window.supabase.auth.getUser();
    if (error) {
        console.error('Error getting current user:', error);
        return null;
    }
    return user;
}
