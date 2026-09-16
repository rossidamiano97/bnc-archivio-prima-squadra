# A.C. BNC - Archivio storico Prima Squadra

Web app pubblica e gestionale per stagioni, rose, partite e statistiche della Prima Squadra.

## 1. Requisiti
- Node.js 20 o successivo
- account GitHub
- progetto Firebase `bnc-archivio-prima-squadra`

## 2. Configurazione locale
1. Copia `.env.example` in `.env`.
2. Inserisci i valori della configurazione Web App mostrati da Firebase.
3. Esegui `npm install`.
4. Esegui `npm run dev`.

Non caricare mai `.env` su GitHub.

## 3. Primo amministratore
1. In Firebase Authentication, scheda Utenti, crea un utente Email/Password.
2. Copia il relativo UID.
3. In Firestore crea manualmente la raccolta `admins`.
4. Crea un documento con ID uguale all'UID e campi: `email` stringa, `active` booleano true.
5. Distribuisci `firestore.rules` prima di usare l'area amministrativa.

## 4. Deploy manuale iniziale
```bash
npm install -g firebase-tools
firebase login
npm install
npm run build
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

## 5. GitHub
Per il primo caricamento, estrai lo ZIP e carica tutti i file con GitHub `Add file > Upload files`. Non caricare lo ZIP stesso e non caricare `.env`.

## 6. Stato versione 0.1
Incluso: struttura pubblica, autenticazione, gestione base di giocatori/stagioni/partite, regole e Hosting.
Prossima versione: rose, distinte, eventi partita, aggregazioni complete e importazione dello storico 2020/21-2025/26.
