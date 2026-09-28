from pathlib import Path
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('type==="goal"?"⚽"','type==="goal"?"⚽️"').replace('type==="assist"?"🅰️"','type==="assist"?"👟"').replace('type==="assist"?"🅰"','type==="assist"?"👟"')
old='const pe=events.filter(e=>e.playerId===a.playerId);return <Link className="formationrow"'
new='const pe=events.filter(e=>e.playerId===a.playerId),assists=events.filter(e=>e.assistPlayerId===a.playerId);return <Link className="formationrow"'
if old in s:s=s.replace(old,new)
old2='{pe.map(e=><span key={e.id} title={e.type}>{eventIcon(e.type)}</span>)}</span>'
new2='{pe.map(e=><span className={`eventicon ${e.type}`} key={e.id} title={e.type}>{eventIcon(e.type)}</span>)}{assists.map(e=><span className="eventicon assist" key={`${e.id}-assist`} title={`Assist a ${e.playerName}`}>👟</span>)}</span>'
if old2 in s:s=s.replace(old2,new2)
old3='<b>{eventIcon(g.type)} {g.playerName}'
if old3 in s:s=s.replace(old3,'<b><span className={`eventicon ${g.type}`}>{eventIcon(g.type)}</span> {g.playerName}')
p.write_text(s,encoding='utf-8');print('PATCH ICONE V8 OK')
