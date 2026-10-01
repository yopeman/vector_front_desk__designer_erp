// Supabase client for Machine Operation ERP (vanilla JS)
window.SUPABASE_URL = 'https://rjsbcqpxllsxsdudjojn.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_PMQ8RAtz4D15lAqk8dPONA_AH_aCIFk';
window.AI_API_BASE_URL = 'https://vector-erp-ai-ms-app.vercel.app/api/v1';

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
