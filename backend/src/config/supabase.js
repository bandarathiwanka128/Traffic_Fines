const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client — bypasses RLS, used for server-side data operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Anon client — used only to verify user JWTs from request headers
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabaseAdmin, supabaseAnon };
