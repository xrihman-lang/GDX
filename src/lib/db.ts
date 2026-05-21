import { collection, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { auth } from '../lib/firebase';

const getPath = (collectionName: string) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Not authenticated");
  return `users/${userId}/${collectionName}`;
};

export async function createDocument(collectionName: string, docId: string, data: any) {
  const path = getPath(collectionName);
  try {
    await setDoc(doc(db, path, docId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${docId}`);
  }
}

export async function updateDocument(collectionName: string, docId: string, data: any) {
  const path = getPath(collectionName);
  try {
    await updateDoc(doc(db, path, docId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${docId}`);
  }
}

export async function deleteDocument(collectionName: string, docId: string) {
  const path = getPath(collectionName);
  try {
    await deleteDoc(doc(db, path, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${docId}`);
  }
}
