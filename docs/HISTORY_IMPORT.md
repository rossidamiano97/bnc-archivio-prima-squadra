# Import storico Prima Squadra BNC - fase 1

Questo pacchetto importa i riepiloghi ufficiali delle stagioni 2020/2021-2025/2026, gli allenatori, i trofei e le statistiche aggregate dei giocatori.

## Importante
- Non importa ancora ogni singolo tabellino, distinta ed evento.
- Non inventa ruoli mancanti: `role` è impostato a `Da verificare`.
- I record hanno ID deterministici e possono essere reimportati senza creare duplicati.

## Installazione nel repository
Copia `data/history`, `scripts/import-history.mjs` e `docs/HISTORY_IMPORT.md` nel progetto.
Installa la dipendenza:

```bash
npm install firebase-admin
```

Aggiungi a `package.json`:

```json
"import:history:dry-run": "node scripts/import-history.mjs --dry-run",
"import:history": "node scripts/import-history.mjs"
```

## Esecuzione in Cloud Shell

```bash
gcloud config set project bnc-archivio-prima-squadra
gcloud auth application-default login
npm run import:history:dry-run
npm run import:history
```

## Collezioni create/aggiornate
- seasons
- coaches
- coachAssignments
- players
- playerSeasonStats
- trophies
- dataQualityIssues
