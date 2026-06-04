// ============================================
// FIELDFORGE — SUPABASE CLIENT
// ============================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if variables are populated and not fallback strings
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn('FieldForge: Supabase credentials are not configured. Running in offline/stub mode.');
}

// Export active client or a safe fallback mock that prevents boot-time crashes
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => { throw new Error('Supabase is not configured.'); },
        signUp: async () => { throw new Error('Supabase is not configured.'); },
        signOut: async () => {}
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error('Supabase is not configured.') })
          })
        }),
        insert: async () => ({ error: new Error('Supabase is not configured.') }),
        update: () => ({
          eq: async () => ({ error: new Error('Supabase is not configured.') })
        }),
        delete: () => ({
          eq: async () => ({ error: new Error('Supabase is not configured.') })
        })
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => {}
        })
      }),
      removeChannel: () => {}
    };
