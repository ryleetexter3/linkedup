const SUPABASE_URL = "https://mmgtsnvdzxkzilwdycjp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZ3RzbnZkenhremlsd2R5Y2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjQwMDMsImV4cCI6MjEwNTcwMDAwM30.9HgUFoBLlIzviAQ1qa5BXo0c1c2EoHsObe8JrqrMauY";

const hasSupabaseConfig =
  SUPABASE_URL !== "https://YOUR_PROJECT_ID.supabase.co" &&
  SUPABASE_ANON_KEY !== "YOUR_PUBLIC_ANON_KEY";


if (!window.supabase) {
  console.error("Supabase client library did not load.");
} else if (!hasSupabaseConfig) {
  console.warn("Add your Supabase Project URL and public anon key in js/supabase.js.");
} else {
  window.linkedUpSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}
