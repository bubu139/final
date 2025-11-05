// frontend_nextjs/src/firebase/auth/use-user.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { useAuth } from '@/firebase'; // Sử dụng hook từ context mới

export function useUser() {
  const auth = useAuth(); // Sử dụng hook từ context
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useUser: Setting up auth listener...');

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log('👤 useUser: Auth state changed:', user ? user.email : 'No user');
        setUser(user);
        setIsUserLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ useUser: Auth state change error:', error);
        setError(error.message);
        setIsUserLoading(false);
      }
    );

    console.log('✅ useUser: Auth listener registered');

    return () => {
      console.log('🧹 useUser: Cleaning up auth listener');
      unsubscribe();
    };
  }, [auth]);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log('✅ User logged out');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      setError(error.message);
    }
  };

  return {
    user,
    isUserLoading,
    error,
    logout,
  };
}