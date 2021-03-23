import { BotModule } from "../types"
import { Client, Message, TextChannel } from "discord.js"

import { Shares, Transaction,
    BALANCE_UNINITIALIZED_ERROR, LOW_BALANCE_ERROR, NOT_ENOUGH_SHARES_ERROR } from "../types/models/shares.dao"
import { getSharesDao } from "../utils/model"
import { generateTable } from "../utils/table"

import axios from "axios"

const sharesDao = getSharesDao()
const FINNHUB_API_URL = "https://finnhub.io/api/v1/quote"

type FinnhubQuote = {
    o: number;
    h: number;
    l: number;
    c: number;
    pc: number;
}

async function handleBuyStocks(user: string, symbol: string, amount: number, channel: TextChannel) {
    const token = process.env.FINNHUB_API_KEY
    
    let currentPrice: number
    try {
        const response = await axios.get(`${FINNHUB_API_URL}?symbol=${symbol}&token=${token}`)
        const data = response.data as FinnhubQuote
        currentPrice = data.c
    } catch (err) {
        return channel.send("Unable to reach Finnhub API at the moment.")
    }

    if (currentPrice === 0) {
        return channel.send(`Stock with symbol ${symbol} does not exist.`)
    }

    try {
        const result = await sharesDao.buyShares(user, symbol, amount, currentPrice)
        return channel.send(`Successfully bought ${amount} shares of \`${symbol}\` at ${currentPrice.toFixed(2)}.\n`
            + `:gem: Money: ${result.startBalance.toFixed(2)} -> **${result.endBalance.toFixed(2)}**\n`
            + `Owned shares of \`${symbol}\`: ${result.startShares} -> **${result.endShares}**`)
    } catch (err) {
        if (err.type === BALANCE_UNINITIALIZED_ERROR) {
            return channel.send("Your :gem: money balance isn't initialized yet. Try again after running !money for the first time.")
        } else if (err.type === LOW_BALANCE_ERROR) {
            return channel.send(`You don\'t have enough :gem: Money to buy ${amount} shares of ${symbol}. (${err.balance.toFixed(2)} / ${err.needed.toFixed(2)})`)
        } else {
            throw err
        }
    }
}

async function handleSellStocks(user: string, symbol: string, amount: number, channel: TextChannel) {
    const token = process.env.FINNHUB_API_KEY
    
    let currentPrice: number
    try {
        const response = await axios.get(`${FINNHUB_API_URL}?symbol=${symbol}&token=${token}`)
        const data = response.data as FinnhubQuote
        currentPrice = data.c
    } catch (err) {
        return channel.send("Unable to reach Finnhub API at the moment.")
    }

    if (currentPrice === 0) {
        return channel.send(`Stock with symbol \`${symbol}\` does not exist.`)
    }

    try {
        const result = await sharesDao.sellShares(user, symbol, amount, currentPrice)
        return channel.send(`Successfully sold ${amount} shares of \`${symbol}\` at ${currentPrice.toFixed(2)}.\n`
            + `:gem: Money: ${result.startBalance.toFixed(2)} -> **${result.endBalance.toFixed(2)}**\n`
            + `Owned shares of \`${symbol}\`: ${result.startShares} -> **${result.endShares}**`)
    } catch (err) {
        if (err.type === BALANCE_UNINITIALIZED_ERROR) {
            return channel.send("Your :gem: Money balance isn't initialized yet. Try again after running !money for the first time.")
        } else if (err.type === NOT_ENOUGH_SHARES_ERROR) {
            return channel.send(`You only own ${err.amount} shares of \`${symbol}\`.`)
        } else {
            throw err
        }
    }
}

async function handlePortfolio(user: string, channel: TextChannel) {
    const portfolio: Array<Shares> = await sharesDao.getSharesByUser(user)
    const rows: Array<Array<string>> = portfolio
        .filter((shares: Shares) => shares.amount > 0)
        .map((shares: Shares) => [ shares.symbol, shares.amount.toString() ])
    if (rows.length === 0) {
        return channel.send("You do not own any stocks.") 
    }
    const table = generateTable([["Symbol", "Owned shares"]].concat(rows), true)
    return channel.send("Your portfolio:\n" + table)
}

async function handleMessage(message: Message) {
    if (!message.channel || !message.member) {
        return
    }

    if (!(message.channel instanceof TextChannel)) {
        return
    }

    if (!message.content.startsWith("!stocks")) {
        return
    }

    const args = message.content.split(" ")
    const command = args[1]
    switch (command) {
        case "buy":
            if (args.length < 4) {
                return message.channel.send("Usage: \`!stocks buy <symbol> <quantity>\`")
            }
            return await handleBuyStocks(message.author.id, args[2], parseInt(args[3]), message.channel)
        case "sell":
            if (args.length < 4) {
                return message.channel.send("Usage: \`!stocks sell <symbol> <quantity>\`")
            }
            return await handleSellStocks(message.author.id, args[2], parseInt(args[3]), message.channel)
        case "portfolio":
            return await handlePortfolio(message.author.id, message.channel)
        default:
            return await message.channel.send("Available commands: \`buy, sell, portfolio\`")
    }
}

export const StocksModule: BotModule = (client: Client) => {
    client.on("message", async message => {
        handleMessage(message)
    })
    console.log("Loaded StocksModule")
}