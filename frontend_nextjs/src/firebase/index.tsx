// frontend_nextjs/src/firebase/index.tsx
"use client";

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { createContext, useContext, ReactNode, useEffect, useState } from 'react';

const firebaseConfig = {
  projectId: "studio-2842628338-a2a68",
  appId: "1:361058835079:web:f3808c6975023fc59db622",
  apiKey: "AIzaSyC9zJbbR3EGq2djHknnT1WBPX_kYVUhgkk",
  authDomain: "studio-2842628338-a2a68.firebaseapp.com",
  messagingSenderId: "361058835079",
  storageBucket: "studio-2842628338-a2a68.firebasestorage.app"
};

// Firebase Context
interface FirebaseContextValue {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  isInitialized: boolean;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  firestore: null,
  auth: null,
  isInitialized: false,
  error: null,
});

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // CHẠY TRÊN CLIENT ONLY
    if (typeof window === 'undefined') {
      console.log('🚫 Running on server, skipping Firebase init');
      return;
    }

    const initFirebase = () => {
      try {
        console.log('🚀 CLIENT: Starting Firebase initialization...');

        // Kiểm tra config
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
          throw new Error('Invalid Firebase config');
        }

        let firebaseApp: FirebaseApp;
        
        // Khởi tạo hoặc lấy app hiện có
        if (getApps().length === 0) {
          console.log('🆕 CLIENT: Initializing new Firebase app...');
          firebaseApp = initializeApp(firebaseConfig);
        } else {
          console.log('✅ CLIENT: Using existing Firebase App');
          firebaseApp = getApps()[0];
        }

        console.log('🔄 CLIENT: Initializing Firestore...');
        const firestoreInstance = getFirestore(firebaseApp);
        
        console.log('🔄 CLIENT: Initializing Auth...');
        const authInstance = getAuth(firebaseApp);

        // SET STATE
        setApp(firebaseApp);
        setFirestore(firestoreInstance);
        setAuth(authInstance);
        setIsInitialized(true);
        setError(null);

        console.log('✅✅✅ CLIENT: Firebase initialized successfully!', {
          hasApp: !!firebaseApp,
          hasFirestore: !!firestoreInstance,
          hasAuth: !!authInstance
        });

      } catch (error: any) {
        console.error('❌ CLIENT: Firebase initialization error:', error);
        setError(error.message);
        setIsInitialized(true);
      }
    };

    initFirebase();
  }, []);

  const value: FirebaseContextValue = {
    app,
    firestore,
    auth,
    isInitialized,
    error,
  };

  console.log('🔥 FirebaseProvider state:', { 
    hasApp: !!app, 
    hasAuth: !!auth,
    hasFirestore: !!firestore,
    isInitialized,
    error
  });

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseClientProvider');
  }
  
  return context;
};

export const useAuth = () => {
  const { auth } = useFirebase();
  
  if (!auth) {
    throw new Error('Auth not initialized. Check FirebaseClientProvider.');
  }
  
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  
  if (!firestore) {
    throw new Error('Firestore not initialized. Check FirebaseClientProvider.');
  }
  
  return firestore;
};

// Export cho các file khác sử dụng
export { firebaseConfig };