// frontend_nextjs/src/firebase/client-provider.tsx
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseClientProvider as MainFirebaseClientProvider } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return (
    <MainFirebaseClientProvider>
      {children}
    </MainFirebaseClientProvider>
  );
}