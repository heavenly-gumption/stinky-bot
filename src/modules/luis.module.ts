import { Client } from "discord.js"
import S3 from "aws-sdk/clients/s3"

import MarkovChain from "markovchain"
const markov = new MarkovChain()
let vocab: string[] = []
const BUCKET: string = process.env.AWS_S3_BUCKET ?? "heavenly-gumption"


const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET
})


async function getChatLogFromS3(user: string): Promise<string> {
    const params = {
        Bucket: BUCKET,
        Key: `markov/${user}.txt`
    }

    const data = await s3.getObject(params).promise()
    if (data.Body instanceof Buffer) {
        return data.Body.toString()
    } else {
        throw data.Body
    }
}

async function initializeMarkov() {
    try {
        console.log("Downloading Chat Data!")
        const logs = await getChatLogFromS3("luis")
        const lines = logs.replace(/\n/g, " ").split(" ")
        vocab = lines
        console.log("Initializing Markov Chain")
        markov.parse(logs)
        console.log("Initialized Markov Chain")
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

export const LuisModule = (client: Client) => {
    initializeMarkov()
    client.on("message", async message => {
        if (message.content && message.content.startsWith("!luis")) {
            message.reply(getResponse(message.content))
        }
    })
}