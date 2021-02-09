import { getFirestoreConnection, getOne } from "../../../utils/db/firestore"
import { Chats, ChatsDao } from '../chats.dao'

const COLLECTION_NAME = 'chats'

function getLog(id: number): Promise<Chats> {
    const chatsRef = getFirestoreConnection().collection(COLLECTION_NAME)
    return getOne<Chats>(chatsRef, id.toString())
}

export const ChatsFirestoreDao: ChatsDao = {
    getLog
}