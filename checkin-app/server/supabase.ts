import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    realtime: {
      // Node 20 lacks native WebSocket support; provide the `ws` package.
      // Unused by this app (no realtime subscriptions), but required for
      // the client to initialize without throwing.
      transport: ws as any,
    },
    auth: { persistSession: false },
  }
);

export default supabase;
