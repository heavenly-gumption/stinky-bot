import { getPgConnection } from '../../../utils/db/pg'
import { Reminder, ReminderDao } from '../reminder.dao'

function getDueReminders(): Promise<Array<Reminder>> {
    const db = getPgConnection()
    const now = new Date();
    return db.any('SELECT * FROM Reminders WHERE time < $1', [now]);
}

function createReminder(id: string, time: Date, content: string, user: string, channel: string) {
    const db = getPgConnection()
    return db.none('INSERT INTO Reminders VALUES ($1, $2, $3, $4, $5)',
        [id, time, content, `\{${user}\}`, channel]);
}

function removeReminder(id: string) {
    const db = getPgConnection()
    return db.none('DELETE FROM Reminders WHERE id = $1', [id]);
}

function addInterestedToReminder(id: string, user: string) {
    // Adds the user to the reminder's interested list without creating duplicates.
    const db = getPgConnection()
    return db.none('UPDATE Reminders ' +
        'SET interested = (select array_agg(distinct e) from unnest(array_append(interested, $2)) e) ' +
        'WHERE id = $1',
        [id, user]);
}

export const ReminderPgDao : ReminderDao = {
    getDueReminders,
    createReminder,
    removeReminder,
    addInterestedToReminder
}