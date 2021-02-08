import { getFirestoreConnection, find } from "../../../utils/db/firestore"
import { VibeHistory, VibeHistoryDao } from '../vibehistory.dao'

function getLastNVibes(id: string, n: number): Promise<Array<VibeHistory>> {
    return new Promise(async (resolve, reject) => {
        const vibeRef = getFirestoreConnection().collection('vibehistory')
        const snapshot = await vibeRef.where('id', '==', id).orderBy('time', 'desc').limit(n).get()
        resolve(snapshot.docs.map(doc => doc.data() as VibeHistory))
    })
}

async function addVibe(id: string, vibe: number): Promise<void> {
    const vibeRef = getFirestoreConnection().collection('vibehistory')
    const now = new Date();
    const vibeHistory: VibeHistory = {
        id,
        vibe,
        time: now.getTime()
    }
    await vibeRef.doc(id + ':' + now.getTime()).set(vibeHistory)
}

export const VibeHistoryFirestoreDao: VibeHistoryDao = {
    getLastNVibes,
    addVibe
}