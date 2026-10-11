// The KPI formulas live with the dashboard-kpis Edge Function so the cloud path
// runs the very same file (Deno imports plain JS). The app imports them from here.
export * from '../../supabase/functions/dashboard-kpis/kpis.js';
