import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

// Lazily create the client on first use instead of at module load time.
// In the published environment, SUPABASE_URL / SUPABASE_ANON_KEY are
// injected via the agent proxy and may not be present yet at process
// boot — creating the client eagerly at import time can crash startup
// before the env vars are populated.
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  console.log(
    `[supabase] initializing client. url present: ${!!url}, anonKey present: ${!!anonKey}`
  );

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: SUPABASE_URL / SUPABASE_ANON_KEY missing from environment."
    );
  }

  // No realtime subscriptions are used by this app, but supabase-js
  // throws at client-creation time on Node runtimes without a native
  // WebSocket global unless a transport is supplied — provide the `ws`
  // package purely so createClient() doesn't throw.
  _supabase = createClient(url, anonKey, {
    realtime: { transport: ws as any },
    auth: { persistSession: false },
  });

  return _supabase;
}

// Proxy object so existing `import supabase from "./supabase"` call sites
// keep working unchanged — every property access resolves the real client
// lazily (on first use, not at import time).
const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    const value = Reflect.get(client as any, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default supabase;
