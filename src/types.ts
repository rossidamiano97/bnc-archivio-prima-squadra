export type Status='draft'|'published';
export interface Player { id:string; displayName:string; role:string; active:boolean; status:Status; }
export interface Season { id:string; label:string; category:string; coach:string; position?:number; points?:number; status:Status; }
export interface Match { id:string; seasonId:string; date:string; competition:string; opponent:string; venue:'Casa'|'Trasferta'; goalsFor:number; goalsAgainst:number; officialGoalsFor:number; officialGoalsAgainst:number; status:Status; }
export interface PlayerStat { playerId:string; displayName:string; appearances:number; starts:number; goals:number; assists:number; yellows:number; reds:number; goalsAgainst:number; cleanSheets:number; }
