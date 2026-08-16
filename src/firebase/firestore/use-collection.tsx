import type { CollectionReference, DocumentData, Query } from 'firebase/firestore';
import { useCollection as useFirestoreCollection } from 'react-firebase-hooks/firestore';

export function useCollection<T extends DocumentData>(
  query?: CollectionReference<T> | Query<T> | null
) {
  const [snapshot, loading, error] = useFirestoreCollection(query, {
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  const data = snapshot?.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as T[] | undefined;

  return { data, loading, error, snapshot };
}
