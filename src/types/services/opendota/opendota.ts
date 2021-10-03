
export enum LobbyType {
  Normal = 0,
  Practice = 1,
  Tournament = 2,
  Tutorial = 3,
  CoopWithBots = 4,
  RankedTeamMM = 5,
  RankedSoloMM = 6,
  RankedMatchmaking = 7,
  SoloMid1v1 = 8,
  BattleCup = 9,
}

export enum GameMode {
  None = 0,
  AllPick = 1,
  CaptainsMode = 2,
  RandomDraft = 3,
  SingleDraft = 4,
  AllRandom = 5,
  Intro = 6,
  Diretide = 7,
  ReverseCaptainsMode = 8,
  TheGreeviling = 9,
  Tutorial = 10,
  MidOnly = 11,
  LeastPlayed = 12,
  LimitedHeroes = 13,
  CompendiumMatchmaking = 14,
  Custom = 15,
  CaptainsDraft = 16,
  BalancedDraft = 17,
  AbilityDraft = 18,
  GameModeEvent = 19,
  AllRandomDeathmatch = 20,
  Mid1v1 = 21,
  AllDraft = 22,
  Turbo = 23,
  Mutation = 24,
}

export function gameModeToString(gameMode: GameMode) {
  switch (gameMode) {
    case GameMode.AllPick:
      return "All Pick"
    case GameMode.CaptainsMode:
      return "Captain's Mode"
    case GameMode.RandomDraft:
      return "Random Draft"
    case GameMode.SingleDraft:
      return "Single Draft"
    case GameMode.AllRandom:
      return "All Random"
    case GameMode.Diretide:
      return "Diretide"
    case GameMode.ReverseCaptainsMode:
      return "Reverse Captain's Mode"
    case GameMode.TheGreeviling:
      return "The Greeviling"
    case GameMode.MidOnly:
      return "Mid Only"
    case GameMode.LeastPlayed:
      return "Least Played"
    case GameMode.LimitedHeroes:
      return "Limited Heroes"
    case GameMode.CompendiumMatchmaking:
      return "Compendium Matchmaking"
    case GameMode.Custom:
      return "Custom Dota"
    case GameMode.CaptainsDraft:
      return "Captain's Draft"
    case GameMode.BalancedDraft:
      return "Balanced Draft"
    case GameMode.AbilityDraft:
      return "Ability Draft"
    case GameMode.AllRandomDeathmatch:
      return "All Random Deathmatch"
    case GameMode.Mid1v1:
      return "Mid 1v1"
    case GameMode.AllDraft:
      return "All Pick"
    case GameMode.Turbo:
      return "Turbo"
    case GameMode.Mutation:
      return "Mutation"
    default:
      return "Dota"
  }
}

export type Player = {
  account_id: number;
  player_slot: number;
  hero_id: number;
  party_id: number;
  party_size: number;
  personaname: string;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  net_worth: number;
  last_hits: number;
  denies: number;
}

// Subset of actual API cause I'm lazy and we don't need the fields
export type Match = {
  match_id: number;
  players: Player[];
  radiant_win: boolean;
  radiant_score: number;
  dire_score: number;
  duration: number;
  lobby_type: LobbyType;
  game_mode: GameMode;
}

export type Hero = {
  id: number;
  name: string;
  localized_name: string;
}

export type OpenDotaService = {
  getMatch: (matchId: string) => Promise<Match>;
  getHero: (id: number) => Promise<Hero>;
}