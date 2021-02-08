import { getFirestoreConnection, find, set, remove, update } from "../../../utils/db/firestore"
import { Reminder, ReminderDao } from '../reminder.dao'

const db = getFirestoreConnection()
const reminderRef = db.collection('reminders')

function getDueReminders(): Promise<Array<Reminder>> {
    const now = new Date();
    return find(reminderRef, 'time', '<', now.getTime())
}

function createReminder(
    id: string, 
    time: Date, 
    content: string, 
    user: string, 
    channel: string): Promise<null>
{
    const reminder: Reminder = { 
        id, 
        time: time.getTime(), 
        content, 
        interested: [user], 
        channel
    }
    return set(reminderRef, id, reminder)
}

function removeReminder(id: string): Promise<null> {
    return remove(reminderRef, id)
}

function addInterestedToReminder(id: string, user: string): Promise<null> {
    // Adds the user to the reminder's interested list without creating duplicates.
    return update(reminderRef, id, {
        interested: FirebaseFirestore.FieldValue.arrayUnion(user)
    })
}

export const ReminderFirestoreDao: ReminderDao = {
    getDueReminders,
    createReminder,
    removeReminder,
    addInterestedToReminder
}