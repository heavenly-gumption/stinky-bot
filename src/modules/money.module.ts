import { BotModule } from "../types"
import { getMoneyBalanceDao } from "../utils/model"
import { User, Message, Client, TextChannel, StageChannel } from "discord.js"
import { BALANCE_UNINITIALIZED_ERROR, LOW_BALANCE_ERROR } from "../types/models/moneybalance.dao"
import pgPromise from "pg-promise"

const MENTION_PATTERN = /<@!?(\d+)>/

const moneyBalanceDao = getMoneyBalanceDao()

async function printBalance(message: Message) {
    if (!message.author || !message.channel || !(message.channel instanceof TextChannel)) {
        return
    }

    const author: User = message.author

    try {
        const balance = await moneyBalanceDao.getBalance(author.id)
            await message.channel.send(author.username + " has **" + balance.amount + "** :gem: ")
    } catch (error) {
        await moneyBalanceDao.initUser(author.id)
        await printBalance(message)
    }
}

async function handlePay(sender: string, receiver: string, amount: number, channel: TextChannel) {
    if (sender === receiver) {
        return channel.send("You cannot send money to yourself.")
    }
    
    if (isNaN(amount)) {
        return channel.send("Please enter a number for the amount of money to send.")
    }

    if (amount <= 0) {
        return channel.send("Amount of money to send must be positive.")
    }

    try {
        await moneyBalanceDao.transfer(sender, receiver, amount)
        return channel.send(`Successfully sent user :gem: **${amount}**.`)
    } catch (err) {
        if (err === BALANCE_UNINITIALIZED_ERROR) {
            return channel.send("Your intended recipient does not have a balance set up. (have them run \`!money\`)")
        } else if (err === LOW_BALANCE_ERROR) {
            return channel.send("You do not have enough money to send.")
        }
    }
}

async function handleMessage(message: Message) {
    if (!message.content || !message.channel || !message.author) {
        return
    }

    if (!(message.channel instanceof TextChannel)) {
        return 
    }

    if (message.content.startsWith("!money")) {
        return await printBalance(message)
    }

    // !pay <mentioned-user> <amount>
    else if (message.content.startsWith("!pay")) {
        const args = message.content.split(" ")
        const sender: string = message.author.id
        const receiverMatch: RegExpMatchArray | null = args[1].match(MENTION_PATTERN)
        if (receiverMatch) {
            const receiver = receiverMatch[1]
            const amount = parseFloat(args[2])
            return await handlePay(sender, receiver, amount, message.channel)
        }
    }
}

export const MoneyModule: BotModule = (client: Client) => {
    console.log("Loaded MoneyModule")
    client.on("messageCreate", async message => {
        await handleMessage(message)
    })
}
