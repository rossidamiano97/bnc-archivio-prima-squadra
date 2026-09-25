import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
const dryRun=process.argv.includes("--dry-run");
const projectId=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"bnc-archivio-prima-squadra";
if(getApps().length===0) initializeApp({credential:applicationDefault(),projectId});
const db=getFirestore(); const root=path.resolve("data/history-v2");
const mapping={"matches.json":"matches","opponents.json":"opponents","appearances.json":"appearances","match-events.json":"matchEvents","data-quality-issues-v2.json":"dataQualityIssues"};
let total=0;
for(const [file,collectionName] of Object.entries(mapping)){
 const rows=JSON.parse(await readFile(path.join(root,file),"utf8")); if(!Array.isArray(rows)) throw new Error(`${file} non contiene un array`);
 console.log(`${collectionName}: ${rows.length}`); total+=rows.length; if(dryRun) continue;
 for(let i=0;i<rows.length;i+=400){const batch=db.batch();const group=rows.slice(i,i+400);for(const row of group){if(!row.id)throw new Error(`ID mancante in ${file}`);batch.set(db.collection(collectionName).doc(row.id),row,{merge:true});}await batch.commit();console.log(`${collectionName}: scritti ${group.length}`);}
}
console.log(dryRun?`DRY RUN V2 OK: ${total} documenti`:`IMPORT V2 OK: ${total} documenti`);
