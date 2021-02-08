import { getFirestoreConnection, getOne } from "../../../utils/db/firestore"
import { Chats, ChatsDao } from '../chats.dao'

const db = getFirestoreConnection()
const chatsRef = db.collection('chats')

function getLog(id: number): Promise<Chats> {
    return getOne<Chats>(chatsRef, id.toString())
}

export const ChatsFirestoreDao: ChatsDao = {
    getLog
}