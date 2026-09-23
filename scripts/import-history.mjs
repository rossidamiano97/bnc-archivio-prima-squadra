import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dryRun = process.argv.includes("--dry-run");
const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "bnc-archivio-prima-squadra";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

const db = getFirestore();
const root = path.resolve("data/history");

const mapping = {
  "seasons.json": "seasons",
  "coaches.json": "coaches",
  "coach-assignments.json": "coachAssignments",
  "players.json": "players",
  "player-season-stats.json": "playerSeasonStats",
  "trophies.json": "trophies",
  "data-quality-issues.json": "dataQualityIssues",
};

let total = 0;

for (const [file, collectionName] of Object.entries(mapping)) {
  const filePath = path.join(root, file);
  const fileContent = await readFile(filePath, "utf8");
  const rows = JSON.parse(fileContent);

  if (!Array.isArray(rows)) {
    throw new Error(`Il file ${file} non contiene un array JSON valido.`);
  }

  console.log(`${collectionName}: ${rows.length}`);
  total += rows.length;

  if (dryRun) {
    continue;
  }

  for (let index = 0; index < rows.length; index += 400) {
    const batch = db.batch();
    const group = rows.slice(index, index + 400);

    for (const row of group) {
      if (!row.id) {
        throw new Error(`ID mancante in ${file}: ${JSON.stringify(row)}`);
      }

      const documentReference = db.collection(collectionName).doc(row.id);
      batch.set(documentReference, row, { merge: true });
    }

    await batch.commit();
    console.log(`${collectionName}: scritti ${group.length} documenti`);
  }
}

console.log(
  dryRun
    ? `DRY RUN OK: ${total} documenti`
    : `IMPORT OK: ${total} documenti`,
);
