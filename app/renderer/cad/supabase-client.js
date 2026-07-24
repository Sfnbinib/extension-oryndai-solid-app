// cad/supabase-client.js — Supabase client for the renderer.
// Uses the PUBLIC anon key only (same as the website) — safe to ship in the bundle.
// Exposes window.SB. Loaded as a plain <script> before the Babel/JSX modules so
// window.SB exists by the time cad-app.jsx mounts.
(function () {
  // Build-time constants (mirror orynd_site_v3/js/auth.js).
  var SUPABASE_URL = 'https://dblquhnokgpavubobfoj.supabase.co';
  var SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibHF1aG5va2dwYXZ1Ym9iZm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDkyNjMsImV4cCI6MjA4NTUyNTI2M30.cZ34l2k2yURZyt_ozLTEIBbTdMMv99dWdXYdONgDbds';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[orynd] supabase-js UMD not loaded — auth disabled');
    window.SB = null;
    return;
  }

  // detectSessionInUrl=false: the renderer is loaded over http://127.0.0.1, there is
  // no OAuth fragment here — tokens arrive via the orynd:// deep-link instead.
  window.SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  window.SB_URL = SUPABASE_URL;
})();
