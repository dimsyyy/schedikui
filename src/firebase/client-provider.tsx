'use client';
import {useState, useEffect, useMemo} from 'react';
import type {ReactNode} from 'react';
import type {FirebaseApp} from 'firebase/app';
import type {Auth} from 'firebase/auth';
import type {Firestore} from 'firebase/firestore';
import {initializeFirebase, FirebaseProvider} from '@/firebase';

type FirebaseClientProviderProps = {
  children: ReactNode;
};

function FirebaseClientProvider({children}: FirebaseClientProviderProps) {
  const [firebaseInstance, setFirebaseInstance] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    const instance = initializeFirebase();
    setFirebaseInstance(instance);
  }, []);

  const providerValue = useMemo(() => {
    if (firebaseInstance) {
      return {
        firebaseApp: firebaseInstance.app,
        auth: firebaseInstance.auth,
        firestore: firebaseInstance.firestore,
      };
    }
    return {firebaseApp: null, auth: null, firestore: null};
  }, [firebaseInstance]);

  if (!firebaseInstance) {
    // You can return a loader here if you want
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={providerValue.firebaseApp}
      auth={providerValue.auth}
      firestore={providerValue.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

export { FirebaseClientProvider };
