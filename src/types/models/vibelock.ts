import { db }  from '../../utils/db'

interface VibeLock {
    id: string,
    lastvibed: number
}

export function getLastVibed(user: string): Promise<VibeLock | null> {
    return db.oneOrNone('SELECT * FROM VibeLock WHERE id = $1', [user]);
}

export function updateLastVibed(user: string): Promise<null> {
    const now = new Date();
    return db.none('INSERT INTO VibeLock (id, lastVibed)' + 
        'VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET lastVibed = $2', [user, now]);
}