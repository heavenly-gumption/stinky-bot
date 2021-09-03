export type Bitmask = number

export enum MatchHistoryStatus {
  Success = 1,
  Failure = 15,
}

export enum LobbyType {
  Invalid = -1,
  Public = 0,
  Practice = 1,
  Tournament = 2,
  Tutorial = 3,
  CoopWithBots = 4,
  TeamMatch = 5,
  SoloQueue = 6,
  RankedMatchmaking = 7,
  SoloMid1v1 = 8,
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
  NewPlayerPool = 13,
  CompendiumMatchmaking = 14,
  CoopVsBots = 15,
  CaptainsDraft = 16,
  AbilityDraft = 17,
  AllRandomDeathmatch = 18,
  MidOnly1v1 = 19,
  RankedMatchmaking = 20,
  TurboMode = 21
}

type MatchHistoryPlayer = {
  account_id: number;
  player_slot: number;
  hero_id: number;
}

type Match = {
  match_id: number;
  match_seq_num: number;
  start_time: number;
  lobby_type: LobbyType;
  players: MatchHistoryPlayer[];
}

type MatchHistory = {
  status: MatchHistoryStatus;
  statusDetail: string | undefined;
  num_results: number;
  total_results: number;
  results_remaining: number;
  matches: Match[];
}

export type GetMatchHistoryResponse = {
  result: MatchHistory;
}

export enum LeaverStatus {
  None = 0,
  Disconnected = 1,
  DisconnetedTooLong = 2,
  Abandoned = 3,
  AFK = 4,
  NeverConnected = 5,
  NeverConnectedTooLong = 6
}

type AdditionalUnit = {
  unitname: string;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
}

export type MatchDetailsPlayer = {
  account_id: number;
  player_slot: number;
  hero_id: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
  backpack_0: number;
  backpack_1: number;
  backpack_2: number;
  item_neutral: number;
  kills: number;
  deaths: number;
  assists: number;
  leaver_status: LeaverStatus;
  last_hits: number;
  denies: number;
  gold_per_min: number;
  xp_per_min: number;
  level: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
  gold: number;
  gold_spent: number;
  scaled_hero_damage: number;
  scaled_tower_damage: number;
  scaled_hero_healing: number;
  additional_units: AdditionalUnit[] | undefined;
}

type PickBan = {
  is_pick: boolean;
  hero_id: number;
  team: number;
  order: number;
}

export type MatchDetails = {
  cluster: number;
  dire_score: number;
  duration: number;
  engine: number;
  first_blood_time: number;
  flags: number;
  game_mode: GameMode;
  human_players: number;
  leagueid: number;
  lobby_type: LobbyType;
  match_id: number;
  match_seq_num: number;
  negative_votes: number;
  picks_bans: PickBan[];
  players: MatchDetailsPlayer[];
  positive_votes: number;
  pre_game_duration: number;
  radiant_score: number;
  radiant_win: boolean;
  season: number;
  start_time: number;
  tower_status_dire: Bitmask;
  tower_status_radiant: Bitmask;
}

export type GetMatchDetailsResponse = {
  result: MatchDetails;
}

export type Hero = {
  name: string;
  id: number;
}

type Heroes = {
  heroes: Hero[];
}

export type GetHeroesResponse = {
  result: Heroes;
}

export type SteamService = {
  getMatchHistory: (accountId: string, matchesRequested: number) => Promise<GetMatchHistoryResponse>;
  getMatchDetails: (matchId: string) => Promise<GetMatchDetailsResponse>;
  getHeroes: () => Promise<GetHeroesResponse>;
}