from pathlib import Path
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('interface SeasonRow extends Season{aggregates?:','interface SeasonRow extends Season{cupResult?:string;aggregates?:')
old='const cup=ms.filter(m=>m.competitionType==="cup"),cupLabel=cup.length?`${cup.length} partite · ${cup.filter(m=>m.goalsFor>m.goalsAgainst).length} vittorie`:"Nessuna gara";'
new='const cup=ms.filter(m=>m.competitionType==="cup"),cupLabel=s.cupResult||(cup.length?`${cup.length} partite`:"Non disputata");'
if old in s:s=s.replace(old,new)
elif 'cupLabel=s.cupResult||' not in s:raise SystemExit('Blocco cupLabel non trovato')
p.write_text(s,encoding='utf-8');print('PATCH UI V8 OK')
