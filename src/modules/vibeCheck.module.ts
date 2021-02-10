import { BotModule } from "../types"
import { Client, Message, ClientUser } from "discord.js"
import { getVibeHistoryDao } from "../utils/model"

const VIBE_CHECK_MAX = 20
const LAST_N_VIBES_MAX = 50
const MILLIS_IN_SECOND = 1000
const SECONDS_IN_MINUTE = 60
const LOCKOUT_MINUTES = 60
const LOCKOUT_MILLIS = MILLIS_IN_SECOND * SECONDS_IN_MINUTE * LOCKOUT_MINUTES
const HUNDRED = 100
const PCT_PRECISION = 5

const vibeHistoryDao = getVibeHistoryDao()

// Returns the number of sequences of n k-sided dice that sum to s
const memoizedCache = new Map<string, number>()
function ways(k: number, n: number, s: number): number {
    const key = `${k}-${n}-${s}`
    const memoizedValue: number | undefined = memoizedCache.get(key)
    if (memoizedValue !== undefined) {
        return memoizedValue
    }

    if (k * n < s) {
        memoizedCache.set(key, 0)
        return 0
    }
    if (n === 1) {
        memoizedCache.set(key, 1)
        return 1
    }
    const lo = Math.max(1, s - k * (n-1))
    const hi = Math.min(k, s - (n-1))
    let ans = 0
    for(let value = lo; value <= hi; value++) {
        ans += ways(k, n-1, s-value)
    }
    memoizedCache.set(key, ans)
    return ans
}

async function doVibeCheck(message: Message) {
    const vibeCheck = Math.floor(Math.random() * VIBE_CHECK_MAX + 1)
    await vibeHistoryDao.addVibe(message.author!.id, vibeCheck)
    await message.channel!.send("Current Vibe: `" + vibeCheck + "`")
}

async function handleVibeCheckMessage(message: Message) {
    if (!message.author || !message.channel) {
        return
    }

    // check lockout
    const lastVibeResponse = await vibeHistoryDao.getLastNVibes(message.author.id, 1)
    if (!lastVibeResponse || lastVibeResponse.length === 0) {
        doVibeCheck(message)
    } else {
        const lastVibe = lastVibeResponse[0]
        const timeDiff = Date.now() - lastVibe.time.getTime()
        if (timeDiff > LOCKOUT_MILLIS) {
            doVibeCheck(message)
        } else {
            const minutes = Math.ceil((LOCKOUT_MILLIS - timeDiff) / MILLIS_IN_SECOND / SECONDS_IN_MINUTE)
            const noun = minutes > 1 ? "minutes" : "minute"
            message.channel.send(`You must wait ${minutes} ${noun} before doing another vibe check.`)
        }
    }
}

async function handleLastNVibesMessage(message: Message) {
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

    const lastNVibesResponse = await vibeHistoryDao.getLastNVibes(
        message.author.id, parseInt(match[0]))

    if (!lastNVibesResponse || lastNVibesResponse.length === 0) {
        await message.channel.send("You have no previous vibes.")
        return
    }

    const lastNVibes: number[] = lastNVibesResponse.map(v => v.vibe).reverse()
    const trueN: number = lastNVibes.length
    const sortedVibes: number[] = [...lastNVibes].sort((a, b) => a - b)

    const sum = sortedVibes.reduce((prev, cur) => prev + cur)
    const avg = sum / trueN
    const median = trueN % 2 == 0 ?
         (sortedVibes[Math.floor(trueN / 2)] + sortedVibes[Math.floor(trueN / 2) - 1]) / 2 :
         sortedVibes[Math.floor(trueN / 2)]
    let cumulativeWays = 0
    for (let s = trueN; s <= sum; s++) {
        cumulativeWays += ways(VIBE_CHECK_MAX, trueN, s)
    }
    const totalWays = Math.pow(VIBE_CHECK_MAX, trueN)
    const pctChanceHigherAvg = (1 - (cumulativeWays / totalWays)) * HUNDRED

    await message.channel.send(`**Your last ${trueN} vibes:**\n` +
        lastNVibes.join(", ") + "\n\n" +
        `**Average:** ${avg.toFixed(1)}\n` +
        `**Median:** ${median.toFixed(1)}\n` +
        `The chance of having a higher average vibe across ${trueN} vibe checks is ${pctChanceHigherAvg.toPrecision(PCT_PRECISION)}%.`)
}

export const VibeCheckModule: BotModule = (client: Client) => {
    console.log("Loaded VibeCheckModule")
    client.on("message", async message => {
        if (message.channel && message.content === "vibe check") {
            await handleVibeCheckMessage(message)
        } else if (message.channel 
            && message.content 
            && !(message.author instanceof ClientUser)
            && message.content.match(/^last \d+ vibes?/)) {

            await handleLastNVibesMessage(message)
        }
    })
}