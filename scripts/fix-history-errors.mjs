// Correzione degli errori di importazione dello storico (v2), trovati confrontando i dati con il PDF "archivio BNC".
//
// Errori corretti:
//  1. 14 cartellini rossi attribuiti a giocatori BNC nella gara Saval Maddalena - BNC Noi (24/03/2024):
//     nel PDF il rosso è dell'avversario ("Cartellini rossi: Saval Maddalena: 1"), nessun giocatore BNC espulso.
//  2. Nomi spezzati a fine riga nel PDF ("Sa- voja N", "Mas- socco L"...) diventati giocatori diversi dall'originale:
//     presenze e cartellini finivano su giocatori "fantasma".
//  3. "Dalla Via F./A." troncato in "Via F./A.", "De Francesco M." in "Francesco M.", refusi (Corigliani, Pollini, Sartot).
//  4. "Pollina G. Danquah K." (virgola persa nel PDF): una sola riga di distinta per due giocatori.
//
// Uso:
//   node scripts/fix-history-errors.mjs                      -> corregge i file JSON in data/history-v2
//   node scripts/fix-history-errors.mjs --firestore          -> DRY RUN su Firestore (mostra cosa cambierebbe)
//   node scripts/fix-history-errors.mjs --firestore --apply  -> applica su Firestore
//   Su Firestore lo script lavora SOLO sulle stagioni passate (non tocca 2026-2027) e riscrive playerSeasonStats
//   delle stagioni del PDF dai dati ufficiali (data/history/player-season-stats.json). Opzioni: --current-season=ID, --no-restore-stats
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const args = process.argv.slice(2);
const useFirestore = args.includes("--firestore");
const apply = args.includes("--apply");
// La stagione in corso viene aggiornata solo dal front end: lo script non la tocca mai.
const CURRENT_SEASON = (args.find((a) => a.startsWith("--current-season=")) || "--current-season=2026-2027").split("=")[1];
// Le statistiche delle stagioni passate vengono ripristinate dai dati ufficiali del PDF (disattivabile con --no-restore-stats).
const restoreArg = args.find((a) => a.startsWith("--restore-stats="));
const noRestore = args.includes("--no-restore-stats");

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// 1) cartellini rossi da eliminare (gara Saval Maddalena 24/03/2024: unico rosso, avversario)
const SAVAL_MATCH = "2023-2024-2024-03-24-campionato-saval-maddalena";
const isBadRed = (e) => e.type === "red" && e.matchId === SAVAL_MATCH;

// 2-3) nomi da correggere (chiave = id errato)
const FIXED_NAMES = {
  "via-f": ["dalla-via-f", "Dalla Via F."],
  "via-a": ["dalla-via-a", "Dalla Via A."],
  "francesco-m": ["de-francesco-m", "De Francesco M."],
  savoja: ["savoja-n", "Savoja N."],
  "corigliani-d": ["corigliano-d", "Corigliano D."],
  "pollini-g": ["pollina-g", "Pollina G."],
  "sartot-l": ["sartor-l", "Sartor L."],
};
// id con trattino da sillabazione: "sa-voja-n" -> "savoja-n". Si riconosce perché, tolti i trattini, coincide con un id valido.
export function canonicalId(id, validIds) {
  if (validIds.has(id)) return id;
  if (FIXED_NAMES[id]) return FIXED_NAMES[id][0];
  const joined = id.replace(/-/g, "");
  for (const v of validIds) if (v.replace(/-/g, "") === joined) return v;
  return id;
}
const displayNameOf = (id, fallback, names) => names.get(id) || (FIXED_NAMES[Object.keys(FIXED_NAMES).find((k) => FIXED_NAMES[k][0] === id)]?.[1]) || fallback;

// Funzione pura: riceve righe e restituisce le righe corrette + il registro delle modifiche
export function fixRows({ appearances, events, validIds, names }) {
  const log = [];
  const outEvents = [];
  for (const e of events) {
    if (isBadRed(e)) { log.push(`ELIMINATO rosso errato: ${e.id} (${e.playerName})`); e.__delete = true; outEvents.push(e); continue; }
    const row = { ...e };
    for (const [idKey, nameKey] of [["playerId", "playerName"], ["assistPlayerId", "assistPlayerName"]]) {
      if (!row[idKey]) continue;
      const c = canonicalId(row[idKey], validIds);
      if (c !== row[idKey]) {
        log.push(`evento ${row.id}: ${row[idKey]} -> ${c}`);
        row[idKey] = c; row[nameKey] = displayNameOf(c, row[nameKey], names);
      }
    }
    outEvents.push(row);
  }
  const outApps = [];
  for (const a of appearances) {
    const row = { ...a };
    if (row.playerId === "pollina-g-danquah-k") {
      // Nel PDF: "Pollina G. Danquah K. (↑)" = virgola persa. Il (↑) è riferito a Danquah K.; Pollina G. resta in panchina.
      log.push(`DA VERIFICARE ${row.id}: riga "Pollina G. Danquah K" -> Danquah K (subentrato) + Pollina G (a disposizione)`);
      outApps.push({ ...row, playerId: "danquah-k", playerName: "Danquah K." });
      outApps.push({ ...row, id: row.id.replace("pollina-g-danquah-k", "pollina-g"), playerId: "pollina-g", playerName: "Pollina G.", appearanceStatus: "unused" });
      continue;
    }
    const c = canonicalId(row.playerId, validIds);
    if (c !== row.playerId) {
      log.push(`distinta ${row.id}: ${row.playerId} -> ${c}`);
      row.id = row.id.replace(row.playerId, c); row.playerId = c; row.playerName = displayNameOf(c, row.playerName, names);
    }
    outApps.push(row);
  }
  // doppioni nella stessa partita dopo l'unione
  const seen = new Map(); const finalApps = [];
  for (const a of outApps) {
    const k = `${a.matchId}|${a.playerId}`;
    if (seen.has(k)) { log.push(`DOPPIONE distinta ${a.matchId} ${a.playerId}: tenuta la riga con più presenza`); const prev = seen.get(k); const rank = { starter: 3, substitute: 2, unused: 1 }; if ((rank[a.appearanceStatus] || 0) > (rank[prev.appearanceStatus] || 0)) { finalApps[finalApps.indexOf(prev)] = a; seen.set(k, a); } continue; }
    seen.set(k, a); finalApps.push(a);
  }
  return { appearances: finalApps, events: outEvents, log };
}

async function main() {
  const players = JSON.parse(await readFile("data/history/players.json", "utf8"));
  const names = new Map(players.map((p) => [p.id, p.displayName]));
  const validIds = new Set(players.map((p) => p.id));

  if (!useFirestore) {
    const appearances = JSON.parse(await readFile("data/history-v2/appearances.json", "utf8"));
    const events = JSON.parse(await readFile("data/history-v2/match-events.json", "utf8"));
    const res = fixRows({ appearances, events, validIds, names });
    res.log.forEach((l) => console.log(l));
    await writeFile("data/history-v2/appearances.json", JSON.stringify(res.appearances, null, 2) + "\n");
    await writeFile("data/history-v2/match-events.json", JSON.stringify(res.events.filter((e) => !e.__delete), null, 2) + "\n");
    console.log(`JSON corretti: ${res.log.length} modifiche`);
    return;
  }

  const { applicationDefault, getApps, initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: "bnc-archivio-prima-squadra" });
  const db = getFirestore();
  const load = async (c) => (await db.collection(c).get()).docs.map((d) => ({ __ref: d.ref, ...d.data(), id: d.id }));
  const past = (d) => d.seasonId !== CURRENT_SEASON;
  const [pl, appsAll, eventAll] = await Promise.all([load("players"), load("appearances"), load("matchEvents")]);
  const appsDocs = appsAll.filter(past), eventDocs = eventAll.filter(past);
  console.log(`Stagione in corso esclusa: ${CURRENT_SEASON} (${appsAll.length - appsDocs.length} distinte e ${eventAll.length - eventDocs.length} eventi non toccati)`);
  pl.forEach((p) => { validIds.add(p.id); if (p.displayName) names.set(p.id, p.displayName); });
  const res = fixRows({ appearances: appsDocs, events: eventDocs, validIds, names });
  res.log.forEach((l) => console.log(l));

  // ---- operazioni Firestore
  const ops = [];
  const byId = (rows) => new Map(rows.map((r) => [r.id, r]));
  const oldApps = byId(appsDocs), oldEvents = byId(eventDocs);
  const strip = ({ __ref, __delete, ...r }) => r;
  for (const e of res.events) {
    if (e.__delete) { ops.push({ type: "delete", ref: oldEvents.get(e.id).__ref }); continue; }
    if (JSON.stringify(strip(e)) !== JSON.stringify(strip(oldEvents.get(e.id)))) ops.push({ type: "set", ref: oldEvents.get(e.id).__ref, data: strip(e) });
  }
  const newAppIds = new Set(res.appearances.map((a) => a.id));
  for (const a of res.appearances) {
    const old = oldApps.get(a.id);
    if (!old) { ops.push({ type: "set", ref: db.collection("appearances").doc(a.id), data: strip(a) }); continue; }
    if (JSON.stringify(strip(a)) !== JSON.stringify(strip(old))) ops.push({ type: "set", ref: old.__ref, data: strip(a) });
  }
  for (const [id, old] of oldApps) if (!newAppIds.has(id)) ops.push({ type: "delete", ref: old.__ref });

  // documenti derivati intestati a giocatori "fantasma": si eliminano (i dati giusti restano sul giocatore vero)
  for (const c of ["squadMembers", "playerSeasonStats", "goalkeeperSeasonStats"]) {
    for (const d of (await load(c)).filter(past)) {
      if (d.playerId && canonicalId(d.playerId, validIds) !== d.playerId) { console.log(`ELIMINATO ${c}/${d.id} (giocatore fantasma ${d.playerId})`); ops.push({ type: "delete", ref: d.__ref }); }
    }
  }

  // confronto/ripristino statistiche ufficiali del PDF
  const official = JSON.parse(await readFile("data/history/player-season-stats.json", "utf8"));
  const stats = (await load("playerSeasonStats")).filter(past);
  const restoreSeasons = noRestore ? [] : restoreArg ? restoreArg.split("=")[1].split(",").filter(Boolean) : [...new Set(official.map((s) => s.seasonId))].filter((x) => x !== CURRENT_SEASON);
  const seasonsInFile = [...new Set(official.map((s) => s.seasonId))].filter((x) => x !== CURRENT_SEASON);
  for (const season of seasonsInFile) {
    const mine = new Map(stats.filter((s) => s.seasonId === season).map((s) => [s.playerId, s]));
    const ref = official.filter((s) => s.seasonId === season);
    const diffs = [];
    for (const o of ref) { const m = mine.get(o.playerId); if (!m || m.appearances !== o.appearances || (m.goals || 0) !== o.goals || (m.assists || 0) !== o.assists) diffs.push(`${o.displayName}: PDF pres ${o.appearances} gol ${o.goals} ass ${o.assists} | database ${m ? `pres ${m.appearances} gol ${m.goals || 0} ass ${m.assists || 0}` : "assente"}`); }
    for (const [pid, m] of mine) if (!ref.some((o) => o.playerId === pid)) diffs.push(`${m.displayName}: presente nel database ma non nel PDF (pres ${m.appearances})`);
    console.log(`STATISTICHE ${season}: ${diffs.length} differenze rispetto al PDF`); diffs.slice(0, 40).forEach((d) => console.log("   " + d));
    if (restoreSeasons.includes(season)) {
      for (const m of mine.values()) ops.push({ type: "delete", ref: m.__ref });
      for (const o of ref) ops.push({ type: "set", ref: db.collection("playerSeasonStats").doc(o.id), data: { ...o, status: "published" } });
      console.log(`  -> ripristino dai dati ufficiali: ${ref.length} righe`);
    }
  }

  console.log(`\nOperazioni previste: ${ops.length} (${ops.filter((o) => o.type === "delete").length} eliminazioni, ${ops.filter((o) => o.type === "set").length} scritture)`);
  if (!apply) { console.log("DRY RUN: nulla è stato scritto. Aggiungi --apply per applicare."); return; }
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    for (const o of ops.slice(i, i + 400)) o.type === "delete" ? batch.delete(o.ref) : batch.set(o.ref, o.data);
    await batch.commit();
  }
  console.log("FATTO.");
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
