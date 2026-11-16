# Controllo dati rispetto al PDF "archivio BNC" (novembre 2026)

Confronto tra PDF (tabelle statistiche di ogni stagione e cronaca partita per partita), dati importati e codice dell'area admin.

## Errori trovati nei dati importati (corretti da `scripts/fix-history-errors.mjs`)
- **Cartellini rossi**: 14 rossi assegnati a giocatori BNC in Saval Maddalena - BNC Noi (24/03/2024). Nel PDF il rosso è dell'avversario. Dopo la correzione i rossi BNC coincidono col PDF in tutte le stagioni (0, 5, 11, 3, 5, 5).
- **Nomi spezzati a fine riga** ("Sa- voja N", "Mas- socco L", ...): 19 id fantasma, 65 righe tra distinte ed eventi. Le presenze di Savoja, Massocco L., Capriotti, Sani, Bortolotti S., Matenin... erano divise tra giocatore vero e giocatore fantasma.
- "Dalla Via F./A." importato come "Via F./A.", "De Francesco M." come "Francesco M.", refusi Corigliani/Pollini/Sartot.
- "Pollina G. Danquah K." (virgola persa nel PDF): da verificare a mano.

## Differenze residue (dipendono dal PDF stesso)
- Gialli: la tabella riepilogativa e la cronaca partita per partita del PDF non coincidono in alcune stagioni (es. 2022/23: 69 vs 66; 2024/25: 53 vs 51; 2025/26: 55 vs 51). Il database segue la cronaca.
- Presenze: restano scarti di 1-2 su alcuni giocatori tra tabella e distinte (es. Doardi M. 2025/26: 10 vs 8). Le statistiche ufficiali (`data/history/player-season-stats.json`) coincidono con le tabelle del PDF.
- Marcatori: in 99 partite su 164 gli eventi gol sono meno del punteggio (marcatori non importati). Per questo l'editor non deve più ricalcolare le statistiche delle stagioni incomplete.

## Problemi del codice admin (corretti)
- Il salvataggio di una partita sovrascriveva il punteggio con il numero di eventi gol: riaprendo una partita storica il risultato poteva diventare sbagliato. Ora c'è il campo "Gol fatti BNC" e un avviso se non coincide con i marcatori.
- Il ricalcolo cancellava e ricostruiva le statistiche della stagione dai soli eventi: per stagioni con marcatori/formazioni incompleti azzerava gol e presenze ufficiali. Ora il ricalcolo salta le stagioni incomplete e lo dice.
- Cliccando un subentrato diventava titolare (12 titolari) e il titolare sostituito restava segnato come uscito; si poteva sostituire due volte lo stesso titolare. Corretto.
- Aggiunti controlli prima del salvataggio: titolari diversi da 11, eventi senza giocatore, due rossi allo stesso giocatore.

## Non gestito (da decidere)
- I cartellini dell'avversario non esistono nel modello: se servono vanno aggiunti (oggi non si possono registrare e c'è il rischio di attribuirli a un giocatore BNC).
- Le statistiche dei portieri (`goalkeeperSeasonStats`) non vengono ricalcolate dall'editor.
- I cartellini non sono aggregati per giocatore nel sito: compaiono solo nel dettaglio partita.
