import { collection, getDocs, orderBy, query, where, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
export async function listPublished<T>(name:string, sort='displayName'){const q=query(collection(db,name),where('status','==','published'),orderBy(sort));const s=await getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()} as T));}
export async function listAll<T>(name:string, sort='displayName'){const q=query(collection(db,name),orderBy(sort));const s=await getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()} as T));}
export async function save(name:string,id:string|undefined,payload:Record<string,unknown>){if(id){await updateDoc(doc(db,name,id),payload);}else{await addDoc(collection(db,name),payload);}}
export async function isAdmin(uid:string){return (await getDoc(doc(db,'admins',uid))).exists();}
export async function bootstrapAggregates(){await setDoc(doc(db,'clubRecords','current'),{status:'published',updatedAt:new Date().toISOString()},{merge:true});}
