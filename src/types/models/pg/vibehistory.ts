import { getPgConnection } from '../../../utils/db/pg'
import { VibeHistory, VibeHistoryDao } from '../vibehistory.dao'

const db = getPgConnection()

function getLastNVibes(id: string, n: number): Promise<VibeHistory[]> {
    return db.manyOrNone('SELECT * FROM VibeHistory WHERE id = $1 ORDER BY time DESC LIMIT $2', [id, n])
}

function addVibe(id: string, vibe: number): Promise<null> {
    const now = new Date();
    return db.none('INSERT INTO VibeHistory (id, vibe, time) VALUES ($1, $2, $3)', [id, vibe, now]);
}

export const VibeHistoryPgDao : VibeHistoryDao = {
    getLastNVibes,
    addVibe
}