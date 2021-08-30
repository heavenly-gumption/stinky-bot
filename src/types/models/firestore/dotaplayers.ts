import firebaseAdmin from "firebase-admin"
import { getFirestoreConnection, allMap } from "../../../utils/db/firestore"
import { DOTA_COLLECTION_NAME, DotaPlayer, DotaPlayerDao } from "../dotaplayers.dao"

let allPlayers: undefined | Map<string, DotaPlayer> = undefined
async function getAllPlayers(): Promise<Map<string, DotaPlayer>> {
    if (allPlayers) {
        return allPlayers
    }
    const playersRef = getFirestoreConnection().collection(DOTA_COLLECTION_NAME)
    allPlayers = await allMap(playersRef)
    return allPlayers
}

async function registerPlayer(discordId: string, steamId: string) {
    const playerRef = getFirestoreConnection().collection(DOTA_COLLECTION_NAME)
    const player = {
        steamId: steamId,
        mmr: -1,
        lastMatchId: -1
    }
    await playerRef.doc(discordId).set(player)
    if (allPlayers) {
        allPlayers.set(discordId, player)
    }
}

async function setLastMatchId(discordId: string, lastMatchId: number) {
    const playerRef = getFirestoreConnection().collection(DOTA_COLLECTION_NAME)
    await playerRef.doc(discordId).update({
        lastMatchId: lastMatchId
    })
    if (allPlayers) {
        allPlayers.get(discordId)!.lastMatchId = lastMatchId
    }
}

export const DotaPlayerFirestoreDao: DotaPlayerDao = {
    getAllPlayers,
    registerPlayer,
    setLastMatchId
}