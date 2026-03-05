import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const noopChain = (res: { data: null; error: { message: string } }) => ({
  select: () => Promise.resolve(res),
  insert: () => Promise.resolve(res),
  update: () => Promise.resolve(res),
  delete: () => Promise.resolve(res),
  single: () => Promise.resolve(res),
  maybeSingle: () => Promise.resolve(res),
  order: () => noopChain(res),
  limit: () => noopChain(res),
  eq: () => noopChain(res),
  then: (fn: any) => Promise.resolve(res).then(fn),
});

export const supabase: SupabaseClient =
  url && key
    ? createClient(url, key)
    : ({
        from: () =>
          noopChain({
            data: null,
            error: { message: "Brak konfiguracji Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)" },
          }) as any,
        auth: {} as any,
        storage: {} as any,
        functions: {} as any,
        rest: {} as any,
        rpc: () => Promise.resolve({ data: null, error: null }) as any,
        remove: {} as any,
        schema: () => ({ from: () => noopChain({ data: null, error: { message: "" } }) }) as any,
        getUrl: () => "",
        restUrl: () => "",
        realtime: {} as any,
        gatewayUrl: () => "",
      } as unknown as SupabaseClient);
