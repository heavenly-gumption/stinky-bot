export type DotaPlayer = {
    steamId: string
    mmr: number
    lastMatchId: number
}

export type DotaPlayerMMRHistory = {
    oldMMR: number
    newMMR: number
}

export const DOTA_COLLECTION_NAME = 'dotaplayers'
export const MMR_HISTORY_SUBCOLLECTION_NAME = 'mmrhistory'

export type DotaPlayerDao = {
    getAllPlayers: () => Promise<Map<string, DotaPlayer>>
    getPlayer: (discordId: string) => Promise<DotaPlayer>
    registerPlayer: (discordId: string, steamId: string, lastMatchId: number) => Promise<void>
    unregisterPlayer: (discordId: string) => Promise<void>
    setLastMatchId: (discordId: string, lastMatchId: number) => Promise<void>
    updateMMR: (discordId: string, newMMR: number) => Promise<void>
}