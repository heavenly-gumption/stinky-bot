import { getFirestoreConnection, find } from "../../../utils/db/firestore"
import { VibeHistory, VibeHistoryDao } from '../vibehistory.dao'

const COLLECTION_NAME = 'vibehistory'

function getLastNVibes(id: string, n: number): Promise<Array<VibeHistory>> {
    return new Promise(async (resolve, reject) => {
        const vibeRef = getFirestoreConnection().collection(COLLECTION_NAME)
        const snapshot = await vibeRef.where('id', '==', id).orderBy('time', 'desc').limit(n).get()
        resolve(snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: data.id,
                time: data.time.toDate(),
                vibe: data.vibe
            }
        }))
    })
}

async function addVibe(id: string, vibe: number): Promise<void> {
    const vibeRef = getFirestoreConnection().collection(COLLECTION_NAME)
    const now = new Date();
    const vibeHistory: VibeHistory = {
        id,
        vibe,
        time: now
    }
    await vibeRef.doc(id + ':' + now.getTime()).set(vibeHistory)
}

export const VibeHistoryFirestoreDao: VibeHistoryDao = {
    getLastNVibes,
    addVibe
}