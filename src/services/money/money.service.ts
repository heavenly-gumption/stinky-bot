import { Message, TextChannel, User } from "discord.js"
import { BALANCE_UNINITIALIZED_ERROR, LOW_BALANCE_ERROR } from "../../types/models/moneybalance.dao"
import { MoneyService, MoneyServiceOptions } from "./type"

export function moneyService({
    moneyBalanceDao
}: MoneyServiceOptions): MoneyService {
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
            await moneyBalanceDao.initUser(author.id)
            await printBalance(message)
        }
    }
    
    async function handlePay(sender: string, receiver: string, amount: number, channel: TextChannel) {
        if (sender === receiver) {
            await channel.send("You cannot send money to yourself.")
            return
        }
        
        if (isNaN(amount)) {
            await channel.send("Please enter a number for the amount of money to send.")
            return
        }
    
        if (amount <= 0) {
            await channel.send("Amount of money to send must be positive.")
            return
        }
    
        try {
            await moneyBalanceDao.transfer(sender, receiver, amount)
            await channel.send(`Successfully sent user :gem: **${amount}**.`)
            return
        } catch (err) {
            if (err === BALANCE_UNINITIALIZED_ERROR) {
                await channel.send("Your intended recipient does not have a balance set up. (have them run \`!money\`)")
                return
            } else if (err === LOW_BALANCE_ERROR) {
                await channel.send("You do not have enough money to send.")
                return
            }
        }
    }

    return {
        printBalance,
        handlePay
    }
}
