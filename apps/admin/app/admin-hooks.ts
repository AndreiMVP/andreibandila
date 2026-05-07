"use client";

import { useEffect, useRef, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

let cachedSupabase: SupabaseClient | null = null;
let cachedSession: Session | null = null;
let cacheInitialized = false;
const verifiedAdminUserIds = new Set<string>();

export function useSupabaseSession(onError: (message: string) => void) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(cachedSupabase);
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [loading, setLoading] = useState(!cacheInitialized);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    try {
      const client = cachedSupabase ?? createSupabaseBrowserClient();
      cachedSupabase = client;
      setSupabase(client);

      async function setVerifiedSession(nextSession: Session | null) {
        if (!nextSession) {
          cachedSession = null;
          cacheInitialized = true;
          setSession(null);
          setLoading(false);
          return;
        }

        if (!verifiedAdminUserIds.has(nextSession.user.id)) {
          const { data, error } = await client
            .from("admin_users")
            .select("user_id")
            .eq("user_id", nextSession.user.id)
            .maybeSingle();

          if (error || !data) {
            onErrorRef.current(error?.message ?? "Contul autentificat nu are acces de admin.");
            await client.auth.signOut();
            cachedSession = null;
            cacheInitialized = true;
            setSession(null);
            setLoading(false);
            return;
          }
          verifiedAdminUserIds.add(nextSession.user.id);
        }

        cachedSession = nextSession;
        cacheInitialized = true;
        setSession(nextSession);
        setLoading(false);
      }

      if (!cacheInitialized) client.auth.getSession().then(({ data }) => setVerifiedSession(data.session));
      const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
        void setVerifiedSession(nextSession);
      });
      return () => data.subscription.unsubscribe();
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error.message : "Supabase nu este configurat.");
      setLoading(false);
    }
  }, []);

  return { supabase, session, loading };
}
