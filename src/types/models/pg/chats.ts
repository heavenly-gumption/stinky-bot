import { getPgConnection }  from '../../../utils/db/pg'
import { Chats, ChatsDao } from '../chats.dao'

function getLog(id: number): Promise<Chats> {
    const db = getPgConnection()
    return db.one('SELECT * FROM Chats WHERE id = $1', [id]);
}

export const ChatsPgDao: ChatsDao = {
    getLog
}