const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zufsncswsoqlomtqhkks.supabase.co';

try {
  const supabase = createClient(supabaseUrl, 'mock-key-for-inspection');
  console.log('supabase.auth.admin:', Object.keys(supabase.auth.admin || {}));
  console.log('updateUserById exists:', typeof supabase.auth.admin.updateUserById);
} catch (err) {
  console.error('Error during client creation or inspection:', err);
}
