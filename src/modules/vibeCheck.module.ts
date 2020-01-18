import { BotModule } from "../types"
import { Client, Message, PartialMessage, ClientUser } from "discord.js"
import { getLastNVibes, addVibe } from "../types/models/vibehistory"

const VIBE_CHECK_MAX = 20
const LAST_N_VIBES_MAX = 50
const MILLIS_IN_SECOND = 1000
const SECONDS_IN_MINUTE = 60
const LOCKOUT_MINUTES = 0.01
const LOCKOUT_MILLIS = MILLIS_IN_SECOND * SECONDS_IN_MINUTE * LOCKOUT_MINUTES

async function doVibeCheck(message: Message | PartialMessage) {
    const vibeCheck = Math.floor(Math.random() * VIBE_CHECK_MAX + 1)
    addVibe(message.author!.id, vibeCheck)
    await message.channel!.send("Current Vibe: `" + vibeCheck + "`")
}

async function handleVibeCheckMessage(message: Message | PartialMessage) {
    if (!message.author || !message.channel) {
        return
    }

    // check lockout
    const lastVibeResponse = await getLastNVibes(message.author.id, 1)
    if (!lastVibeResponse || lastVibeResponse.length === 0) {
        doVibeCheck(message)
    } else {
        const lastVibe = lastVibeResponse[0]
        const timeDiff = Date.now() - lastVibe.time
        if (timeDiff > LOCKOUT_MILLIS) {
            doVibeCheck(message)
        } else {
            const minutes = Math.ceil((LOCKOUT_MILLIS - timeDiff) / MILLIS_IN_SECOND / SECONDS_IN_MINUTE)
            const noun = minutes > 1 ? "minutes" : "minute"
            message.channel.send(`You must wait ${minutes} ${noun} before doing another vibe check.`)
        }
    }
}

async function handleLastNVibesMessage(message: Message | PartialMessage) {
    if (!message.author || !message.channel) {
        return
    }

    const match = message.content!.match(/\d+/)
    if (!match) {
        console.log("Something terrible has happened")
        return
    }

    const n = parseInt(match[0])
    if (n > LAST_N_VIBES_MAX) {
        await message.channel.send(`You may only see your last ${LAST_N_VIBES_MAX} vibes.`)
        return
    }

    const lastNVibesResponse = await getLastNVibes(message.author.id, parseInt(match[0]))

    if (!lastNVibesResponse || lastNVibesResponse.length === 0) {
        await message.channel.send("You have no previous vibes.")
        return
    }

    const lastNVibes: number[] = lastNVibesResponse.map(v => v.vibe)
    const trueN: number = lastNVibes.length
    const sortedVibes: number[] = [...lastNVibes].sort((a, b) => a - b)

    const sum = sortedVibes.reduce((prev, cur) => prev + cur)
    const avg = sum / trueN
    const median = trueN % 2 == 0 ?
         (sortedVibes[Math.floor(trueN / 2)] + sortedVibes[Math.ceil(trueN / 2)]) / 2 :
         sortedVibes[Math.floor(trueN / 2)]

    await message.channel.send(`**Your last ${trueN} vibes:**\n` +
        lastNVibes.join(", ") + "\n\n" +
        `**Average:** ${avg.toFixed(1)}\n` +
        `**Median:** ${median.toFixed(1)}\n`)
}

export const VibeCheckModule: BotModule = (client: Client) => {
    console.log("Loaded VibeCheckModule")
    client.on("message", async message => {
        if (message.channel && message.content === "vibbe check") {
            await handleVibeCheckMessage(message)
        } else if (message.channel 
            && message.content 
            && !(message.author instanceof ClientUser)
            && message.content.match(/^last \d+ vibes?/)) {

            await handleLastNVibesMessage(message)
        }
    })
}