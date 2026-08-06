// ============================================
// FIELDFORGE — SUPABASE CLIENT
// ============================================
import { createClient } from '@supabase/supabase-js';

// Read via the *static* `import.meta.env.VITE_*` form so Vite inlines the real
// values at build/serve time. (Aliasing import.meta.env to a variable defeats
// that inlining — the runtime object only carries built-ins, not VITE_* vars —
// which silently drops the app into offline/stub mode.) The try/catch keeps the
// Node test runner happy, where import.meta.env is undefined.
let supabaseUrl, supabaseAnonKey;
try {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
} catch (_) {
  supabaseUrl = undefined;
  supabaseAnonKey = undefined;
}

// Check if variables are populated and not fallback strings
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn('RELAY: Supabase credentials are not configured. Running in offline/stub mode.');
}

// Export active client or a safe fallback mock that prevents boot-time crashes
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => { throw new Error('Supabase is not configured.'); },
        signUp: async () => { throw new Error('Supabase is not configured.'); },
        signOut: async () => {},
        updateUser: async () => ({ data: null, error: new Error('Supabase is not configured.') }),
        resetPasswordForEmail: async () => ({ data: null, error: new Error('Supabase is not configured.') })
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
      removeChannel: () => {},
      functions: {
        invoke: async () => ({ data: null, error: new Error('Supabase is not configured.') })
      }
    };
