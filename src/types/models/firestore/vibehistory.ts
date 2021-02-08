import { getFirestoreConnection, find, set, remove, update } from "../../../utils/db/firestore"
import { VibeHistory, VibeHistoryDao } from '../vibehistory.dao'

const db = getFirestoreConnection()
const vibeRef = db.collection('vibehistory')

function getLastNVibes(id: string, n: number): Promise<Array<VibeHistory>> {
    return new Promise(async (resolve, reject) => {
        const snapshot = await vibeRef.where('id', '==', id).orderBy('time', 'desc').limit(n).get()
        resolve(snapshot.docs.map(doc => doc.data() as VibeHistory))
    })
}

function addVibe(id: string, vibe: number): Promise<null> {
    const now = new Date();
    const vibeHistory: VibeHistory = {
        id,
        vibe,
        time: now.getTime()
    }
    return set(vibeRef, id + ':' + now.getTime(), vibeHistory)
}

export const VibeHistoryFirestoreDao: VibeHistoryDao = {
    getLastNVibes,
    addVibe
}