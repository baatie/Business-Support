import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    // This will throw when we try to use it if env vars are missing
    console.warn('Missing Supabase environment variables')
}

export const supabase = createClient(
    'https://oerlnenzaltfqypqbsgr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcmxuZW56YWx0ZnF5cHFic2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE3NjAsImV4cCI6MjA4NjE1Nzc2MH0.JKP-xezDazBcaV3HEsZGhtQ45vcVg1zDhLRRueuCn_U'
)
