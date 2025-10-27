'use client';
import {useContext} from 'react';
import {useAuth, useUser as useFirebaseUserHook} from '@/firebase/provider';

/**
 * @deprecated This hook is deprecated. Please use `useUser` from `@/firebase` directly.
 */
export const useUser = () => {
  const auth = useAuth();
  const {user, loading} = useFirebaseUserHook();
  return {auth, user, loading};
};
