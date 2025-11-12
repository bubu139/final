"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';

interface SupabaseContextValue {
  client: SupabaseClient | null;
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  error: string | null;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

interface SupabaseClientProviderProps {
  children: ReactNode;
}

export function SupabaseClientProvider({ children }: SupabaseClientProviderProps) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Thiếu cấu hình Supabase. Vui lòng kiểm tra biến môi trường.');
      setIsInitialized(true);
      return;
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'mindview-canvas-auth',
      },
    });

    setClient(supabaseClient);

    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (error) {
        setError(error.message);
      }
      setSession(data.session ?? null);
      setIsInitialized(true);
    });

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession);
      setError(null);
      setIsInitialized(true);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SupabaseContextValue>(() => ({
    client,
    session,
    user: session?.user ?? null,
    isInitialized,
    error,
  }), [client, session, isInitialized, error]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseClientProvider');
  }

  return context;
}

export function useSupabaseClient() {
  return useSupabase().client;
}

export function useSupabaseSession() {
  return useSupabase().session;
}
