import { getFirestoreConnection, findOne, getOne, 
    all, set, remove, update } from "../../../utils/db/firestore"
import { Clip, ClipDao } from '../clip.dao'

const db = getFirestoreConnection()
const clipsRef = db.collection('clips')

function getClip(id: string): Promise<Clip> {
    return getOne(clipsRef, id)
}

function getClipByName(name: string): Promise<Clip> {
    return findOne(clipsRef, 'name', '==', name)
}

function getAllClips(): Promise<Array<Clip>> {
    return all(clipsRef)
}

async function deleteClipByName(name: string): Promise<null> {
    const clip = await getClipByName(name)
    return remove(clipsRef, clip.id)
}

function createClip(clip: Clip): Promise<null> {
    return set(clipsRef, clip.id, clip)
}

async function renameClip(oldName: string, newName: string): Promise<null> {
    const clip = await getClipByName(oldName)
    return update(clipsRef, clip.id, { name: newName })
}

async function trimClip(name: string, start: number, end: number): Promise<null> {
    const clip = await getClipByName(name)
    return update(clipsRef, clip.id, { clipstart: start, clipend: end })
}

export const ClipFirestoreDao: ClipDao = {
    getClip,
    getClipByName,
    getAllClips,
    deleteClipByName,
    createClip,
    renameClip,
    trimClip
}