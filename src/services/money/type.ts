import { Message, TextChannel } from "discord.js"
import { MoneyBalanceDao } from "../../types/models/moneybalance.dao"

export type MoneyService = {
    printBalance: (message: Message) => Promise<void>;
    handlePay: (sender: string, receiver: string, amount: number, channel: TextChannel) => Promise<void>;
}

export type MoneyServiceOptions = {
    moneyBalanceDao: MoneyBalanceDao;
}