import { BotModule } from "../types"
import { Client, Message, MessageReaction, User, Channel, TextChannel } from "discord.js"
import { Reminder, getDueReminders, createReminder, 
    addInterestedToReminder, removeReminder } from "../types/models/reminder"

import * as chrono from "chrono-node"
import { CronJob } from "cron"

const COMMAND_REGEX: RegExp = /!remindme (.+?) to (.+)/


// Creates a reminder at a given time specified with natural language.
async function handleMessage(match: RegExpMatchArray, message: Message) {
    const date: Date = chrono.parseDate(match[1], new Date(), {forwardDate: true})
    const content: string = match[2]
    const reminderMessages: Message | Array<Message> = await message.channel.send(
        `Created reminder at:\n\u23F0 **${date}** \n to *${content}*.\n\n` +
        "React to this message to also be reminded of this event.")
    const reminderMessage: Message = Array.isArray(reminderMessages) ? 
        reminderMessages[0] : reminderMessages
    await createReminder(reminderMessage.id, date, content, message.author.id, message.channel.id)
}

export const ReminderModule: BotModule = (client: Client) => {
    console.log("Loaded ReminderModule")
    client.on("message", async message => {
        if (message.channel) {
            const match: RegExpMatchArray | null = message.content.match(COMMAND_REGEX)
            if (match !== null) {
                await handleMessage(match, message)
            }
        }
    })

    // When a user reacts to a message, add them to the list of users to ping. 
    client.on("messageReactionAdd", async (reaction: MessageReaction, user: User) => {
        await addInterestedToReminder(reaction.message.id, user.id)
    })

    // Every minute, periodically query the Reminders table for any reminders that are due.
    // Send a message to the channel the reminder was created in, mentioning all of the users
    // that have reacted to the message, was well as the reminder creator. Then, delete the reminder.
    const job = new CronJob("0 * * * * *", async () => {
        const reminders: Array<Reminder> = await getDueReminders()
        reminders.forEach(async (reminder) => {
            const mentions: string = reminder.interested.map((s) => `<@${s}>`).join(", ")
            const message: string = mentions + "\nReminder: " + reminder.content
            const channel: Channel | undefined = client.channels.get(reminder.channel)
            if (channel !== undefined) {
                await (channel as TextChannel).send(message)
            }
            await removeReminder(reminder.id)
        })
    })
    job.start()
}