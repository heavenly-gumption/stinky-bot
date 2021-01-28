import { db }  from '../../utils/db'

interface Chats {
    id: number,
    log: string
}

export function getLog(id: number): Promise<Chats> {
    return db.one('SELECT * FROM Chats WHERE id = $1', [id]);
}