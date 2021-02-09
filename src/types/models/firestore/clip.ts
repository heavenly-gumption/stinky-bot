import { getFirestoreConnection, findOne, getOne, all } from "../../../utils/db/firestore"
import { Clip, ClipDao } from '../clip.dao'

const COLLECTION_NAME = 'clips'

function getClip(id: string): Promise<Clip> {
    const clipsRef = getFirestoreConnection().collection(COLLECTION_NAME)
    return getOne(clipsRef, id)
}

function getClipByName(name: string): Promise<Clip> {
    const clipsRef = getFirestoreConnection().collection(COLLECTION_NAME)
    return findOne(clipsRef, 'name', '==', name)
}

function getAllClips(): Promise<Array<Clip>> {
    const clipsRef = getFirestoreConnection().collection(COLLECTION_NAME)
    return all(clipsRef)
}

async function deleteClipByName(name: string): Promise<void> {
    const clipsRef = getFirestoreConnection().collection(COLLECTION_NAME)
    const clip = await getClipByName(name)
    await clipsRef.doc(clip.id).delete()
}

async function createClip(clip: Clip): Promise<void> {
    const clipsRef = getFirestoreConnection().collection(COLLECTION_NAME)
    await clipsRef.doc(clip.id).set(clip)
}

async function renameClip(oldName: string, newName: string): Promise<void> {
    const clipsRef = getFirestoreConnection().collection(COLLECTION_NAME)
    const clip = await getClipByName(oldName)
    await clipsRef.doc(clip.id).update({ name: newName })
}

async function trimClip(name: string, start: number, end: number): Promise<void> {
    const clipsRef = getFirestoreConnection().collection(COLLECTION_NAME)
    const clip = await getClipByName(name)
    await clipsRef.doc(clip.id).update({ clipstart: start, clipend: end })
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