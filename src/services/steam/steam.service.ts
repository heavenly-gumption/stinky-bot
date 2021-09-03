import axios from "axios"

import {
  GetMatchHistoryResponse,
  GetMatchDetailsResponse,
  GetHeroesResponse,
  SteamService
} from "../../types/services/steam/steam"

async function getMatchHistory(accountId: string, matchesRequested: number): Promise<GetMatchHistoryResponse> {
  const result = await axios.get("https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1", {
    params: {
      key: process.env.STEAM_API_KEY,
      account_id: accountId,
      matches_requested: matchesRequested,
    }
  })
  return result.data as GetMatchHistoryResponse
}

async function getMatchDetails(matchId: string): Promise<GetMatchDetailsResponse> {
  const result = await axios.get("https://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/v1", {
    params: {
      key: process.env.STEAM_API_KEY,
      match_id: matchId,
    }
  })
  return result.data as GetMatchDetailsResponse
}

async function getHeroes(): Promise<GetHeroesResponse> {
  const result = await axios.get("https://api.steampowered.com/IEconDOTA2_570/GetHeroes/v1", {
    params: {
      key: process.env.STEAM_API_KEY,
    }
  })
  return result.data as GetHeroesResponse
}

export function steamService(): SteamService {
  return {
    getMatchHistory,
    getMatchDetails,
    getHeroes,
  }
}