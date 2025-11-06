// frontend_nextjs/src/firebase/auth/use-user.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { useAuth } from '@/firebase'; // <-- Dùng hook từ context là đúng

export function useUser() {
  const auth = useAuth(); // <-- Giờ sẽ là null khi SSR, không ném lỗi
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useUser: Setting up auth listener...');

    // --- BẮT ĐẦU SỬA ---
    // Nếu auth chưa có (đang SSR hoặc provider chưa load xong)
    // thì không làm gì cả.
    if (!auth) {
      console.log('⚠️ useUser: Auth service not yet available. Waiting for provider.');
      // Giữ isUserLoading = true để trang login hiển thị "Đang tải..."
      return;
    }
    // --- KẾT THÚC SỬA ---

    console.log('✅ useUser: Auth listener registering...');
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
  }, [auth]); // Giữ [auth] để khi auth thay đổi (từ null -> object), effect này chạy lại

  const logout = async () => {
    // Thêm kiểm tra an toàn
    if (!auth) {
      console.error('❌ Logout error: Auth not available');
      return;
    }
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