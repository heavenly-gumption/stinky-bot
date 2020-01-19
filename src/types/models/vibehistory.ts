import { db } from '../../utils/db'

interface VibeHistory {
    id: string,
    time: number,
    vibe: number
}

export function getLastNVibes(id: string, n: number): Promise<VibeHistory[]> {
    return db.manyOrNone('SELECT * FROM VibeHistory WHERE id = $1 ORDER BY time DESC LIMIT $2', [id, n])
}

export function addVibe(id: string, vibe: number): Promise<null> {
    const now = new Date();
    return db.none('INSERT INTO VibeHistory (id, vibe, time) VALUES ($1, $2, $3)', [id, vibe, now]);
}