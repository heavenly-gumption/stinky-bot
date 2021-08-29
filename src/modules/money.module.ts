import { Message, Client, TextChannel } from "discord.js"
import { MoneyService } from "../services/money"

const MENTION_PATTERN = /<@!(\d+)>/

export type MoneyModuleOptions = {
    moneyService: MoneyService;
}

async function handleMessage(message: Message, moneyService: MoneyService) {
    if (!message.content || !message.channel || !message.author) {
        return
    }

    if (!(message.channel instanceof TextChannel)) {
        return 
    }

    if (message.content.startsWith("!money")) {
        return await moneyService.printBalance(message)
    }

    // !pay <mentioned-user> <amount>
    else if (message.content.startsWith("!pay")) {
        const args = message.content.split(" ")
        const sender: string = message.author.id
        const receiverMatch: RegExpMatchArray | null = args[1].match(MENTION_PATTERN)
        if (receiverMatch) {
            const receiver = receiverMatch[1]
            const amount = parseFloat(args[2])
            return await moneyService.handlePay(sender, receiver, amount, message.channel)
        }
    }
}

export const MoneyModule = (client: Client, {moneyService}: MoneyModuleOptions) => {
    console.log("Loaded MoneyModule")
    client.on("message", async message => {
        await handleMessage(message, moneyService)
    })
}