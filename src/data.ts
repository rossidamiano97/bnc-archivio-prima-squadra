import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";

import { db } from "./firebase";

export async function listAll<T>(
  collectionName: string,
  sortField?: string,
  direction: "asc" | "desc" = "asc",
): Promise<T[]> {
  const publicQuery = query(
    collection(db, collectionName),
    where("status", "==", "published"),
  );

  const snapshot = await getDocs(publicQuery);

  const rows = snapshot.docs.map(
    (documentSnapshot) =>
      ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }) as T,
  );

  if (!sortField) {
    return rows;
  }

  return rows.sort((first, second) => {
    const firstValue = String(
      (first as Record<string, unknown>)[sortField] ?? "",
    );
    const secondValue = String(
      (second as Record<string, unknown>)[sortField] ?? "",
    );

    const comparison = firstValue.localeCompare(
      secondValue,
      "it",
      {
        numeric: true,
        sensitivity: "base",
      },
    );

    return direction === "asc" ? comparison : -comparison;
  });
}

export async function save(
  collectionName: string,
  documentId: string | undefined,
  payload: DocumentData,
): Promise<void> {
  if (documentId) {
    await updateDoc(
      doc(db, collectionName, documentId),
      payload,
    );
    return;
  }

  await addDoc(
    collection(db, collectionName),
    payload,
  );
}

export async function remove(
  collectionName: string,
  documentId: string,
): Promise<void> {
  await deleteDoc(
    doc(db, collectionName, documentId),
  );
}

export async function isAdmin(
  uid: string,
): Promise<boolean> {
  const adminDocument = await getDoc(
    doc(db, "admins", uid),
  );

  return (
    adminDocument.exists() &&
    adminDocument.data().active !== false
  );
}

export async function listAdminAll<T>(collectionName:string):Promise<T[]>{const snapshot=await getDocs(collection(db,collectionName));return snapshot.docs.map(d=>({id:d.id,...d.data()}) as T)}
export async function archive(collectionName:string,documentId:string,uid:string):Promise<void>{await updateDoc(doc(db,collectionName,documentId),{status:"archived",active:false,updatedBy:uid,updatedAt:serverTimestamp()})}
