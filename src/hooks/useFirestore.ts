import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  QueryConstraint
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFirestoreQuery<T>(collectionName: string, queryConstraints: QueryConstraint[] = []) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const path = `users/${user.uid}/${collectionName}`;
    const q = query(collection(db, path), ...queryConstraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      setData(docs);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}

export function useFirestoreDoc<T>(collectionName: string, docId: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !docId) return;
    
    setLoading(true);
    const path = `users/${user.uid}/${collectionName}`;
    const docRef = doc(db, path, docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.GET, `${path}/${docId}`);
    });

    return () => unsubscribe();
  }, [user, collectionName, docId]);

  return { data, loading, error };
}
