import {createBrowserClient} from '@supabase/ssr'
import {ClientType, SassClient} from "@/lib/supabase/unified";
import {Database} from "@/lib/types";

export function createSupabaseBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL or Anon Key is not defined in environment variables for browser client.');
        throw new Error('Supabase URL or Anon Key is not defined for browser client.');
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export async function createSPASassClient() {
    const client = createSupabaseBrowserClient();
    return new SassClient(client, ClientType.SPA);
}