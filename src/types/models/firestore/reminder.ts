import { getFirestoreConnection, find } from "../../../utils/db/firestore"
import { Reminder, ReminderDao } from '../reminder.dao'

function getDueReminders(): Promise<Array<Reminder>> {
    const reminderRef = getFirestoreConnection().collection('reminders')
    const now = new Date();
    return find(reminderRef, 'time', '<', now.getTime())
}

async function createReminder(
    id: string, 
    time: Date, 
    content: string, 
    user: string, 
    channel: string): Promise<void>
{
    const reminderRef = getFirestoreConnection().collection('reminders')
    const reminder: Reminder = { 
        id, 
        time: time.getTime(), 
        content, 
        interested: [user], 
        channel
    }
    await reminderRef.doc(id).set(reminder)
}

async function removeReminder(id: string): Promise<void> {
    const reminderRef = getFirestoreConnection().collection('reminders')
    await reminderRef.doc(id).delete()
}

async function addInterestedToReminder(id: string, user: string): Promise<void> {
    const reminderRef = getFirestoreConnection().collection('reminders')
    // Adds the user to the reminder's interested list without creating duplicates.
    await reminderRef.doc(id).update({
        interested: FirebaseFirestore.FieldValue.arrayUnion(user)
    })
}

export const ReminderFirestoreDao: ReminderDao = {
    getDueReminders,
    createReminder,
    removeReminder,
    addInterestedToReminder
}