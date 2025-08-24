// Supabase Configuration for ScoreLeague
// Replace with your actual Supabase project credentials

const SUPABASE_URL = 'https://rksuuouwfdixcscgsmlj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrc3V1b3V3ZmRpeGNzY2dzbWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDIyMjAsImV4cCI6MjA2OTI3ODIyMH0.K2gyhzMEXuAggH_jGyrmXsSLH5CYxAwh8xn446wDi5A';

// Initialize Supabase client
let supabase;
try {
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
    } else {
        console.error('Supabase library not loaded properly');
        // Fallback - try alternative initialization
        if (typeof createClient !== 'undefined') {
            supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized with fallback method');
        }
    }
} catch (error) {
    console.error('Error initializing Supabase client:', error);
}

// Database table names
const TABLES = {
    USERS: 'users',
    BETS: 'bets',
    MATCHES: 'matches',
    LEADERBOARD: 'leaderboard_cache'
};

// Export for use in other files
window.supabaseConfig = {
    supabase,
    TABLES
};
