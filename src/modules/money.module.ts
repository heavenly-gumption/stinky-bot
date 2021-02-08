import { BotModule } from "../types"
import { getMoneyBalanceDao } from "../utils/model"
import { User, Message, Client } from "discord.js"
import pgPromise from "pg-promise"

const moneyBalanceDao = getMoneyBalanceDao()

async function printBalance(message: Message) {
    if (!message.author || !message.channel) {
        return
    }

    const author: User = message.author

    try {
        const balance = await moneyBalanceDao.getBalance(author.id)
        if (message.channel) {
            await message.channel.send(author.username + " has **" + balance.amount + "** :gem: ")
        }
    } catch (error) {
        if (error instanceof pgPromise.errors.QueryResultError) {
            await moneyBalanceDao.initUser(author.id)
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