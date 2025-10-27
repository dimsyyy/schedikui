'use client';
import {useState, useEffect, useMemo} from 'react';
import {
  onSnapshot,
  doc,
  type DocumentReference,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import {FirestorePermissionError} from '@/firebase/errors';

export function useDoc<T>(
  ref: DocumentReference<DocumentData> | null
): {data: (T & {id: string})[] | null; loading: boolean; error: Error | null} {
  const [data, setData] = useState<(T & {id: string})[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedDocRef = useMemo(() => ref, [ref?.path]);

  useEffect(() => {
    if (!memoizedDocRef) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      doc => {
        if (doc.exists()) {
          setData([{id: doc.id, ...doc.data()} as T & {id: string}]);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });
        setError(contextualError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  return {data, loading, error};
}
