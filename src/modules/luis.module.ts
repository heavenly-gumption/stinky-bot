import { BotModule } from "../types"
import { getLog } from "../types/models/chats"

import { User, Message, Client } from "discord.js"
import pgPromise from "pg-promise"
import { ParsingResult } from "chrono-node/dist/results"

import MarkovChain from "markovchain"
const markov = new MarkovChain()
let vocab: string[] = []

async function initializeMarkov() {
    try {
        console.log("Downloading chat data")
        const logs = await getLog(0) // TODO: support multiple chatbots than hardcoding this
        const lines = logs.log.replace(/\n/g, " ").split(" ")
        vocab = lines
        console.log("Initializing markov data")
        markov.parse(logs.log)
        console.log("loaded markov data")
        console.log("Loaded Luis Module")
    } catch (error) {
        console.error(error)
    }
}

function getResponse(messageContent: string){
    const messageWords = messageContent.split(" ").filter(word => word !== "!luis")
    let result
    if (vocab.length === 0) {
        result = "In Low Priority Queue. Please Ask Me Later"
        return result
    }
    if (Math.random() < (process.env.GIBBERISH_RATIO || 0.5) || messageWords.length === 0) {
        const word = vocab[Math.floor(Math.random() * vocab.length)]
        result = markov.start(word).end().process()
    } else {
        const word = messageWords[Math.floor(Math.random() * messageWords.length)]
        result = markov.start(word).end().process()
    }

    return result
}

export const LuisModule: BotModule = (client: Client) => {
    initializeMarkov()
    client.on("message", async message => {
        if (message.content && message.content.startsWith("!luis")) {
            message.reply(getResponse(message.content))
        }
    })
}