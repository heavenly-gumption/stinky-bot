import { BotModule } from "../types"
import { getBalance, initUser } from "../types/models/moneybalance"
import { User, Message, Client } from "discord.js"
import pgPromise from "pg-promise"

async function printBalance(message: Message) {
    if (!message.author || !message.channel) {
        return
    }

    const author: User = message.author

    try {
        const balance = await getBalance(author.id)
        if (message.channel) {
            await message.channel.send(author.username + " has **" + balance.amount + "** :gem: ")
        }
    } catch (error) {
        if (error instanceof pgPromise.errors.QueryResultError) {
            await initUser(author.id)
            await printBalance(message)
        }
    }
}

export const MoneyModule: BotModule = (client: Client) => {
    console.log("Loaded MoneyModule")
    client.on("message", async message => {
        if (message.content && message.content.startsWith("!money")) {
            await printBalance(message)
        }
    })
}