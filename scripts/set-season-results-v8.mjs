import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if(getApps().length===0)initializeApp({credential:applicationDefault(),projectId:"bnc-archivio-prima-squadra"});
const db=getFirestore();
const seasons={
 "2020-2021":{cupResult:"Non disputata"},
 "2021-2022":{cupResult:"Usciti ai gironi",league:{position:5,points:37}},
 "2022-2023":{cupResult:"Usciti ai gironi"},
 "2023-2024":{cupResult:"Vittoria"},
 "2024-2025":{cupResult:"Usciti ai gironi"},
 "2025-2026":{cupResult:"Vittoria"}
};
for(const[id,data]of Object.entries(seasons)){await db.collection("seasons").doc(id).set(data,{merge:true});console.log(`${id}: ${data.cupResult}${data.league?` | campionato ${data.league.position}° - ${data.league.points} punti`:""}`)}
console.log("RISULTATI STAGIONI V8 CORRETTI OK");
