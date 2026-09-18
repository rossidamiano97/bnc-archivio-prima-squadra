import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, type DocumentData } from "firebase/firestore";
import { db } from "./firebase";
export async function listAll<T>(name:string, sort?:string, direction:"asc"|"desc"="asc"):Promise<T[]> { const ref=sort?query(collection(db,name),orderBy(sort,direction)):query(collection(db,name)); const s=await getDocs(ref); return s.docs.map(d=>({id:d.id,...d.data()} as T)); }
export async function save(name:string,id:string|undefined,payload:DocumentData){ if(id) await updateDoc(doc(db,name,id),payload); else await addDoc(collection(db,name),payload); }
export async function remove(name:string,id:string){ await deleteDoc(doc(db,name,id)); }
export async function isAdmin(uid:string){ const d=await getDoc(doc(db,"admins",uid)); return d.exists() && d.data().active!==false; }
