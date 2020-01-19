import { db } from '../../utils/db'

interface VibeHistory {
    id: string,
    time: number,
    vibe: number
}

type DailyVibeStat = {
    id: string,
    averageVibe: number,
    maxVibe: number,
    minVibe: number,
    numberOfVibes: number,
    mostRecentVibe: string
}

export function getLastNVibes(id: string, n: number): Promise<VibeHistory[]> {
    return db.manyOrNone('SELECT * FROM VibeHistory WHERE id = $1 ORDER BY time ASC LIMIT $2', [id, n])
}

export async function getDailyVibeStats(): Promise<DailyVibeStat[]> {
    // const query = "SELECT id, AVG(vibe) AS avg_vibe, MAX(vibe) as max_vibe, MIN(vibe) as min_vibe, COUNT(vibe) as number_of_vibes, MAX(time) AS most_recent_vibe FROM VibeHistory WHERE time > date_trunc('day', localtimestamp) GROUP BY id HAVING COUNT(vibe) > 1 ORDER by id ASC;"
    const query = "SELECT id, AVG(vibe) AS avg_vibe, MAX(vibe) as max_vibe, MIN(vibe) as min_vibe, COUNT(vibe) as number_of_vibes, MAX(time) AS most_recent_vibe FROM VibeHistory GROUP BY id HAVING COUNT(vibe) > 1 ORDER by id ASC;"
    // const rawRowStats: {
    //     id: string,
    //     avg_vibe: string,
    //     max_vibe: number,
    //     min_vibe: number,
    //     number_of_vibes: number,
    //     most_recent_vibe: string
    // }[] = await db.manyOrNone(query)
    const rawRowStats = await db.manyOrNone(query)
    console.log(JSON.stringify(rawRowStats, null, 2))
    return rawRowStats.map((row): DailyVibeStat => ({
        id: row.id,
        averageVibe: Number(row.avg_vibe),
        maxVibe: Number(row.max_vibe),
        minVibe: Number(row.min_vibe),
        numberOfVibes: Number(row.number_of_vibes),
        mostRecentVibe: row.most_recent_vibe.toISOString()
    }))
}

export function addVibe(id: string, vibe: number): Promise<null> {
    const now = new Date()
    return db.none('INSERT INTO VibeHistory (id, vibe, time) VALUES ($1, $2, $3)', [id, vibe, now])
}