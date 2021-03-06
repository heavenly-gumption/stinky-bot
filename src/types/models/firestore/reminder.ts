import firebaseAdmin from "firebase-admin"
import { getFirestoreConnection, find } from "../../../utils/db/firestore"
import { Reminder, ReminderDao } from '../reminder.dao'

const COLLECTION_NAME = 'reminders'

function getDueReminders(): Promise<Array<Reminder>> {
    const reminderRef = getFirestoreConnection().collection(COLLECTION_NAME)
    const now = new Date();
    return find(reminderRef, 'time', '<', now, (data) => {
        return {
            id: data.id,
            time: data.time.toDate(),
            content: data.content,
            interested: data.interested,
            channel: data.channel
        }
    })
}

async function createReminder(
    id: string, 
    time: Date, 
    content: string, 
    user: string, 
    channel: string): Promise<void>
{
    const reminderRef = getFirestoreConnection().collection(COLLECTION_NAME)
    const reminder: Reminder = { 
        id, 
        time, 
        content, 
        interested: [user], 
        channel
    }
    await reminderRef.doc(id).set(reminder)
}

async function removeReminder(id: string): Promise<void> {
    const reminderRef = getFirestoreConnection().collection(COLLECTION_NAME)
    await reminderRef.doc(id).delete()
}

async function addInterestedToReminder(id: string, user: string): Promise<void> {
    const reminderRef = getFirestoreConnection().collection(COLLECTION_NAME)
    // Adds the user to the reminder's interested list without creating duplicates.
    await reminderRef.doc(id).update({
        interested: firebaseAdmin.firestore.FieldValue.arrayUnion(user)
    })
}

export const ReminderFirestoreDao: ReminderDao = {
    getDueReminders,
    createReminder,
    removeReminder,
    addInterestedToReminder
}