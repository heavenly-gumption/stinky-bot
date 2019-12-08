import { BotModule } from "../types"
import { Client, Message, PartialMessage } from "discord.js"
import { getLastVibed, updateLastVibed } from "../types/models/vibelock"

const MILLIS_IN_SECOND = 1000
const SECONDS_IN_MINUTE = 60
const LOCKOUT_MINUTES = 60
const LOCKOUT_MILLIS = MILLIS_IN_SECOND * SECONDS_IN_MINUTE * LOCKOUT_MINUTES

async function doVibeCheck(message: Message | PartialMessage) {
    const vibeCheck = 20
    await message.channel!.send("Current Vibe: `" + Math.floor(Math.random() * Math.floor(vibeCheck) + 1) + "`")
}

async function handleVibeCheckMessage(message: Message | PartialMessage) {
    if (!message.author || !message.channel) {
        return
    }

    // check lockout
    const vibeLock = await getLastVibed(message.author.id)
    if (!vibeLock) {
        updateLastVibed(message.author.id)
        doVibeCheck(message)
    } else {
        const timeDiff = Date.now() - vibeLock.lastvibed
        if (timeDiff > LOCKOUT_MILLIS) {
            updateLastVibed(message.author.id)
            doVibeCheck(message)
        } else {
            const minutes = Math.floor((LOCKOUT_MILLIS - timeDiff) / MILLIS_IN_SECOND / SECONDS_IN_MINUTE)
            message.channel.send(`You must wait ${minutes} minute(s) before doing another vibe check.`)
        }
    }
}

export const VibeCheckModule: BotModule = (client: Client) => {
    console.log("Loaded VibeCheckModule")
    client.on("message", async message => {
        if (message.channel && message.content === "vibe check") {
            await handleVibeCheckMessage(message)
        }
    })
}