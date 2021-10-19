import firebaseAdmin from "firebase-admin"
import { getFirestoreConnection, getOne, allMap } from "../../../utils/db/firestore"
import {
    DOTA_COLLECTION_NAME,
    MMR_HISTORY_SUBCOLLECTION_NAME,
    DotaPlayer,
    DotaPlayerDao
} from "../dotaplayers.dao"

let allPlayers: undefined | Map<string, DotaPlayer> = undefined
async function getAllPlayers(): Promise<Map<string, DotaPlayer>> {
    if (allPlayers) {
        return allPlayers
    }
    const playersRef = getFirestoreConnection().collection(DOTA_COLLECTION_NAME)
    allPlayers = await allMap(playersRef)
    return allPlayers
}

async function getPlayer(discordId: string) {
    if (!allPlayers) {
        const playersRef = getFirestoreConnection().collection(DOTA_COLLECTION_NAME)
        allPlayers = await allMap(playersRef)
    }
    const player = allPlayers.get(discordId)
    if (!player) {
        throw "Player not found: " + discordId
    }
    return player
}

async function registerPlayer(discordId: string, username: string, steamId: string, lastMatchId: number) {
    const playerRef = getFirestoreConnection().collection(DOTA_COLLECTION_NAME)
    const player = {
        username: username,
        steamId: steamId,
        mmr: -1,
        lastMatchId: lastMatchId
    }
    await playerRef.doc(discordId).set(player)
    if (allPlayers) {
        allPlayers.set(discordId, player)
    }
}

async function unregisterPlayer(discordId: string) {
    const playerRef = getFirestoreConnection().collection(DOTA_COLLECTION_NAME)
    await playerRef.doc(discordId).delete()
    if (allPlayers) {
        allPlayers.delete(discordId)
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

async function updateMMR(discordId: string, newMMR: number) {
    const playerRef = getFirestoreConnection().collection(DOTA_COLLECTION_NAME)
    const player = await getOne<DotaPlayer>(playerRef, discordId)
    const oldMMR = player.mmr

    await playerRef.doc(discordId).update({
        mmr: newMMR
    })

    const now = Date.now()
    await playerRef.doc(discordId)
        .collection(MMR_HISTORY_SUBCOLLECTION_NAME)
        .doc(now.toString())
        .set({ oldMMR, newMMR })

    if (allPlayers) {
        allPlayers.get(discordId)!.mmr = newMMR
    }
}

export const DotaPlayerFirestoreDao: DotaPlayerDao = {
    getAllPlayers,
    getPlayer,
    registerPlayer,
    unregisterPlayer,
    setLastMatchId,
    updateMMR
}