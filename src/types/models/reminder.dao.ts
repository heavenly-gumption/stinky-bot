export type Reminder = {
    id: string,
    time: Date,
    content: string,
    interested: string[]
    channel: string
}

export type ReminderDao = {
    getDueReminders: () => Promise<Array<Reminder>>
    createReminder: (id: string, time: Date, content: string, 
        user: string, channel: string) => Promise<null | void>,
    removeReminder: (id: string) => Promise<null | void>,
    addInterestedToReminder: (id: string, user: string) => Promise<null | void>
} 