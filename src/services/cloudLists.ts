import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type CloudList = {
  items: unknown[];
  updatedAt: string;
};

export async function loadCloudList(path: string): Promise<CloudList | null> {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, path));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  if (!Array.isArray(data.items) || typeof data.updatedAt !== 'string') {
    return null;
  }
  return { items: data.items, updatedAt: data.updatedAt };
}

export async function saveCloudList(
  path: string,
  items: unknown[],
  updatedAt: string,
): Promise<void> {
  if (!db) {
    return;
  }
  await setDoc(doc(db, path), { items, updatedAt });
}
