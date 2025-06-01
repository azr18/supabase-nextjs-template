import {createServerClient, type CookieOptions} from '@supabase/ssr'
import {cookies} from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key is not defined in environment variables.')
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Errors can occur if trying to set cookies from a Server Component.
                        // Usually, middleware handles session refresh and cookie setting.
                        // Log error for visibility, but don't break execution if benign.
                        // console.warn('Failed to set cookie from server client:', error);
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Errors can occur if trying to delete cookies from a Server Component.
                        // console.warn('Failed to remove cookie from server client:', error);
                    }
                },
            }
        }
    )
}

// If your project was using a createSSRSassClient, 
// it should be updated to use the synchronous createSupabaseServerClient:
// import { ClientType, SassClient } from "@/lib/supabase/unified"; // Assuming these types exist
// export function createSSRSassServerClient() { // Changed to Server to avoid confusion
//   const client = createSupabaseServerClient(); // No await
//   return new SassClient(client, ClientType.SERVER);
// }