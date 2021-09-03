import axios from "axios"

import { Match, Hero, OpenDotaService } from "../../types/services/opendota/opendota"

async function getMatch(matchId: string): Promise<Match> {
  const result = await axios.get(`https://api.opendota.com/api/matches/${matchId}`)
  return result.data as Match
}

let heroesCache: undefined | Record<string, Hero> = undefined
async function getHeroes(): Promise<Record<string, Hero>> {
  if (heroesCache) {
    return heroesCache
  }
  const result = await axios.get("https://api.opendota.com/api/constants/heroes")
  heroesCache = result.data
  return result.data
}

async function getHero(id: number): Promise<Hero> {
  const idstr = id.toString()
  let heroes = await getHeroes()
  // if the hero id is not found, invalidate cache and try again
  if (!heroes[idstr]) {
    console.log("Unrecognized hero id found, invalidating cache")
    heroesCache = undefined
    heroes = await getHeroes()
  }

  // if we STILL can't find it, give up
  if (!heroes[idstr]) {
    return {
      id,
      name: "npc_dota_hero_unknown",
      localized_name: "UNKNOWN_HERO"
    }
  } else {
    return heroes[idstr]
  }
}

export function openDotaService(): OpenDotaService {
  return {
    getMatch,
    getHero
  }
}