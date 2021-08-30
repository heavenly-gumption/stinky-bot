export type DotaPlayer = {
    steamId: string
    mmr: number
    lastMatchId: number
}

export const DOTA_COLLECTION_NAME = 'dotaplayers'

export type DotaPlayerDao = {
    getAllPlayers: () => Promise<Map<string, DotaPlayer>>
    registerPlayer: (discordId: string, steamId: string) => Promise<void>
    setLastMatchId: (discordId: string, lastMatchId: number) => Promise<void>
}