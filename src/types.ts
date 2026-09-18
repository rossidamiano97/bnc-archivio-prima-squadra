export type Status = "draft" | "published" | "archived";
export type CompetitionType = "league" | "cup" | "playoff" | "playout" | "friendly";
export type AppearanceStatus = "starter" | "substitute" | "unused" | "not_called";
export interface Player { id:string; displayName:string; role:string; active:boolean; status:Status; }
export interface Coach { id:string; displayName:string; active:boolean; status:Status; }
export interface Opponent { id:string; name:string; aliases?:string[]; active:boolean; status:Status; }
export interface Season { id:string; label:string; category:string; group?:string; coach?:string; position?:number; points?:number; status:Status; }
export interface SquadMember { id:string; seasonId:string; playerId:string; playerName:string; role:string; shirtNumber?:number; startDate?:string; endDate?:string; active:boolean; status:Status; }
export interface Match { id:string; seasonId:string; seasonLabel:string; date:string; competition:string; competitionType:CompetitionType; opponent:string; venue:"Casa"|"Trasferta"; goalsFor:number; goalsAgainst:number; officialGoalsFor?:number; officialGoalsAgainst?:number; penaltyFor?:number; penaltyAgainst?:number; coach?:string; round?:string; notes?:string; status:Status; }
export interface Appearance { id:string; matchId:string; seasonId:string; playerId:string; playerName:string; role:string; appearanceStatus:AppearanceStatus; goalkeeper:boolean; goalsConceded?:number; fullMatch?:boolean; status:Status; }
export type EventType="goal"|"assist"|"yellow"|"red"|"penalty_scored"|"penalty_missed"|"penalty_saved"|"own_goal_for"|"own_goal_against";
export interface MatchEvent { id:string; matchId:string; seasonId:string; playerId?:string; playerName?:string; type:EventType; minute?:string; status:Status; }
export interface PlayerStat { playerId:string; displayName:string; appearances:number; starts:number; substituteAppearances:number; goals:number; penaltyGoals:number; assists:number; yellows:number; reds:number; goalsAgainst:number; cleanSheets:number; }
