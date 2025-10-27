'use client';
import {useState, useEffect, useMemo} from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Query,
  type FirestoreError,
} from 'firebase/firestore';
import {useFirestore, useAuth} from '@/firebase/provider';
import {FirestorePermissionError} from '@/firebase/errors';

export function useCollection<T>(
  q: Query<DocumentData> | null
): {data: (T & {id: string})[] | null; loading: boolean; error: Error | null} {
  const [data, setData] = useState<(T & {id: string})[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the query to prevent re-renders from creating new query objects
  const memoizedQuery = useMemo(() => q, [q?.toString()]);

  useEffect(() => {
    if (!memoizedQuery) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      snapshot => {
        const result: (T & {id: string})[] = [];
        snapshot.forEach(doc => {
          result.push({id: doc.id, ...doc.data()} as T & {id: string});
        });
        setData(result);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        // Create a contextual error for permission issues
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: (memoizedQuery as any)._query.path.canonicalString(), // internal but useful
        });
        setError(contextualError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return {data, loading, error};
}
