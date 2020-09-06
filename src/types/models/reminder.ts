import { db }  from '../../utils/db'

export interface Reminder {
    id: string,
    time: number,
    content: string,
    interested: string[]
    channel: string
}

export function getDueReminders(): Promise<Array<Reminder>> {
    const now = new Date();
    return db.any('SELECT * FROM Reminders WHERE time < $1', [now]);
}

export function createReminder(id: string, time: Date, content: string, user: string, channel: string) {
    return db.none('INSERT INTO Reminders VALUES ($1, $2, $3, $4, $5)',
        [id, time, content, `\{${user}\}`, channel]);
}

export function removeReminder(id: string) {
    return db.none('DELETE FROM Reminders WHERE id = $1', [id]);
}

export function addInterestedToReminder(id: string, user: string) {
    // Adds the user to the reminder's interested list without creating duplicates.
    return db.none('UPDATE Reminders ' +
        'SET interested = (select array_agg(distinct e) from unnest(array_append(interested, $2)) e) ' +
        'WHERE id = $1',
        [id, user]);
}