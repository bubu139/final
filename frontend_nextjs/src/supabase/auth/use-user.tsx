"use client";

import { useCallback, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useSupabase } from '@/supabase';

interface UseUserResult {
  user: User | null;
  session: Session | null;
  isUserLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

export function useUser(): UseUserResult {
  const { client, session, user, isInitialized, error } = useSupabase();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    if (!client) {
      setLogoutError('Supabase client chưa sẵn sàng.');
      return;
    }

    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) {
      setLogoutError(signOutError.message);
      throw signOutError;
    }

    setLogoutError(null);
  }, [client]);

  return useMemo(() => ({
    user,
    session,
    isUserLoading: !isInitialized,
    error: logoutError ?? error,
    logout: handleLogout,
  }), [user, session, isInitialized, logoutError, error, handleLogout]);
}
