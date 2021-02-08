import { getFirestoreConnection, getOne } from "../../../utils/db/firestore"
import { Chats, ChatsDao } from '../chats.dao'

function getLog(id: number): Promise<Chats> {
    const chatsRef = getFirestoreConnection().collection('chats')
    return getOne<Chats>(chatsRef, id.toString())
}

export const ChatsFirestoreDao: ChatsDao = {
    getLog
}