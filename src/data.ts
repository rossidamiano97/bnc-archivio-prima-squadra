import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import { db } from "./firebase";

export async function listPublished<T>(
  collectionName: string,
  sortField = "displayName",
): Promise<T[]> {
  const databaseQuery = query(
    collection(db, collectionName),
    where("status", "==", "published"),
    orderBy(sortField),
  );

  const snapshot = await getDocs(
    databaseQuery,
  );

  return snapshot.docs.map(
    (documentSnapshot) =>
      ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }) as T,
  );
}

export async function listAll<T>(
  collectionName: string,
  sortField = "displayName",
): Promise<T[]> {
  const databaseQuery = query(
    collection(db, collectionName),
    orderBy(sortField),
  );

  const snapshot = await getDocs(
    databaseQuery,
  );

  return snapshot.docs.map(
    (documentSnapshot) =>
      ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }) as T,
  );
}

export async function save(
  collectionName: string,
  documentId: string | undefined,
  payload: DocumentData,
): Promise<void> {
  if (documentId) {
    await updateDoc(
      doc(
        db,
        collectionName,
        documentId,
      ),
      payload,
    );

    return;
  }

  await addDoc(
    collection(db, collectionName),
    payload,
  );
}

export async function isAdmin(
  uid: string,
): Promise<boolean> {
  const adminDocument = await getDoc(
    doc(db, "admins", uid),
  );

  if (!adminDocument.exists()) {
    return false;
  }

  const adminData = adminDocument.data();

  return adminData.active !== false;
}

export async function bootstrapAggregates(): Promise<void> {
  await setDoc(
    doc(db, "clubRecords", "current"),
    {
      status: "published",
      updatedAt: new Date().toISOString(),
    },
    {
      merge: true,
    },
  );
}
