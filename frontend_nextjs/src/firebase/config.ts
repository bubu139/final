// // frontend_nextjs/src/firebase/config.ts
// import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
// import { getAuth, Auth } from 'firebase/auth';
// import { getFirestore, Firestore } from 'firebase/firestore';

// const firebaseConfig = {
//   projectId: "studio-2842628338-a2a68",
//   appId: "1:361058835079:web:f3808c6975023fc59db622",
//   apiKey: "AIzaSyC9zJbbR3EGq2djHknnT1WBPX_kYVUhgkk",
//   authDomain: "studio-2842628338-a2a68.firebaseapp.com",
//   messagingSenderId: "361058835079",
//   storageBucket: "studio-2842628338-a2a68.firebasestorage.app"
// };

// console.log('🚀 Firebase Config loaded:', {
//   projectId: firebaseConfig.projectId,
//   authDomain: firebaseConfig.authDomain
// });

// // Initialize Firebase
// let app: FirebaseApp;
// let auth: Auth;
// let db: Firestore;

// try {
//   if (getApps().length === 0) {
//     console.log('🆕 Initializing Firebase app...');
//     app = initializeApp(firebaseConfig);
//     console.log('✅ Firebase app initialized');
//   } else {
//     app = getApps()[0];
//     console.log('✅ Using existing Firebase app');
//   }

//   auth = getAuth(app);
//   db = getFirestore(app);
  
//   console.log('🎉 Firebase services initialized successfully');
// } catch (error) {
//   console.error('💥 Firebase initialization failed:', error);
//   throw error;
// }

// export { auth, db };
// export default app;
export { firebaseConfig } from './index';