import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const projectId=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"bnc-archivio-prima-squadra";
if(getApps().length===0)initializeApp({credential:applicationDefault(),projectId});
const db=getFirestore();
const snap=await db.collection("matches").where("seasonId","==","2021-2022").where("opponent","==","Young Boys").get();
if(snap.empty)throw new Error("Partita Young Boys 2021/2022 non trovata");
let updated=0;
for(const doc of snap.docs){const m=doc.data();if(m.date==="2021-11-21"){await doc.ref.set({goalsFor:1,goalsAgainst:3,quality:"reconciled",reconciliationNote:"Risultato riallineato al riepilogo stagionale e al singolo marcatore riportato nel PDF."},{merge:true});updated++;}}
if(updated!==1)throw new Error(`Attesa 1 partita da correggere, trovate ${updated}`);
const all=await db.collection("matches").get();const expected={"2020-2021":[4,3,1,0,16,4],"2021-2022":[26,14,4,8,59,26],"2022-2023":[31,5,7,19,28,63],"2023-2024":[37,18,11,8,75,43],"2024-2025":[35,9,6,20,40,62],"2025-2026":[31,19,6,6,58,31]};const by={};for(const d of all.docs){const m=d.data();if(!expected[m.seasonId])continue;(by[m.seasonId]??=[]).push(m)}
for(const[s,e]of Object.entries(expected)){const a=by[s]||[],v=a.filter(m=>m.goalsFor>m.goalsAgainst).length,n=a.filter(m=>m.goalsFor===m.goalsAgainst).length,p=a.length-v-n,gf=a.reduce((t,m)=>t+m.goalsFor,0),gs=a.reduce((t,m)=>t+m.goalsAgainst,0),got=[a.length,v,n,p,gf,gs];if(got.some((x,i)=>x!==e[i]))throw new Error(`${s}: ottenuto ${got.join(', ')}, atteso ${e.join(', ')}`);console.log(`${s}: OK ${got.join(' / ')}`)}
console.log("RICONCILIAZIONE OK: 164 partite, 68 vittorie, 276 GF, 229 GS, DR +47");
