import {readFile} from "node:fs/promises";
const root="data/history-v2/";const files=["matches.json","opponents.json","appearances.json","match-events.json"];
const data={};for(const f of files)data[f]=JSON.parse(await readFile(root+f,"utf8"));
const expected={"2020-2021":4,"2021-2022":26,"2022-2023":31,"2023-2024":37,"2024-2025":35,"2025-2026":31};
const actual={};for(const m of data["matches.json"])actual[m.seasonId]=(actual[m.seasonId]||0)+1;
for(const [s,n] of Object.entries(expected))if(actual[s]!==n)throw new Error(`${s}: attese ${n}, trovate ${actual[s]||0}`);
for(const [f,rows] of Object.entries(data)){const ids=new Set();for(const r of rows){if(!r.id)throw new Error(`ID mancante in ${f}`);if(ids.has(r.id))throw new Error(`ID duplicato ${r.id} in ${f}`);ids.add(r.id);}}
console.log(`VALIDAZIONE V2 OK: ${data["matches.json"].length} partite, ${data["opponents.json"].length} avversari, ${data["appearances.json"].length} righe distinta, ${data["match-events.json"].length} eventi`);
