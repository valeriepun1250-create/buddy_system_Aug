import type { DocumentReference, DocumentData } from 'firebase/firestore';
import { useDocument as useFirestoreDocument } from 'react-firebase-hooks/firestore';

export function useDoc<T extends DocumentData>(
  docRef?: DocumentReference<T> | null
) {
  const [snapshot, loading, error] = useFirestoreDocument(docRef, {
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  const data = snapshot?.exists()
    ? ({ ...snapshot.data(), id: snapshot.id } as T)
    : undefined;

  return { data, loading, error, snapshot };
}
