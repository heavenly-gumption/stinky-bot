import { BotModule } from "../types"
import { Client, Message, TextChannel } from "discord.js"

import { Shares, Transaction, NOT_ENOUGH_SHARES_ERROR } from "../types/models/shares.dao"
import { BALANCE_UNINITIALIZED_ERROR, LOW_BALANCE_ERROR } from "../types/models/moneybalance.dao"
import { getMoneyBalanceDao, getSharesDao } from "../utils/model"
import { generateTable } from "../utils/table"

import axios from "axios"

type FinnhubQuote = {
    o: number;
    h: number;
    l: number;
    c: number;
    pc: number;
}

type PriceCacheItem = {
    time: Date;
    price: number;
}

const FINNHUB_API_URL = "https://finnhub.io/api/v1/quote"
const CACHE_TTL = 60 * 60 * 1000

const moneyBalanceDao = getMoneyBalanceDao()
const sharesDao = getSharesDao()
const priceCache: Map<string, PriceCacheItem> = new Map()


async function getStockPrice(symbol: string): Promise<number> {
    const token = process.env.FINNHUB_API_KEY
    const response = await axios.get(`${FINNHUB_API_URL}?symbol=${symbol}&token=${token}`)
    const data = response.data as FinnhubQuote
    // update the cache here
    const now = new Date()
    priceCache.set(symbol, { time: now, price: data.c })
    return data.c
}

// Retrieves stock prices first from the local cache, then API call if needed.
async function getCachedStockPrice(symbol: string): Promise<number> {
    const now = new Date()
    if (priceCache.has(symbol)) {
        const cacheItem = priceCache.get(symbol)!
        if (now.getTime() - cacheItem.time.getTime() < CACHE_TTL) {
            return cacheItem.price
        }
    }
    const price = await getStockPrice(symbol)
    priceCache.set(symbol, { time: now, price: price })
    return price
}

// Retrieves stock prices first from the local cache, then API call if needed.
async function getCachedStockPrices(symbols: Array<string>): Promise<Map<string, number>> {
    const prices = await Promise.all(symbols.map(symbol => getCachedStockPrice(symbol)))
    const stockPrices = new Map<string, number>()
    prices.forEach((price, i) => {
        stockPrices.set(symbols[i], price)
    })
    return stockPrices
}

function getTransactionString(verb: string, amount: number, symbol: string, currentPrice: number, txn: Transaction) {
    let comment = ""
    if (verb === "sold") {
        const ratio = txn.price / txn.startAvg
        if (ratio > 1) {
            // One rocket emoji for every 25% above 100%
            comment = ":rocket: ".repeat((ratio - 1) / 0.25)
        } else if (ratio < 0.5) {
            // GUH if below 50%, stonks down emoji for every 10% below that
            comment = "**GUH** " + ":chart_with_downwards_trend: ".repeat((0.5 - ratio) / 0.1)
        }
    }

    return `Successfully ${verb} ${amount} shares of \`${symbol}\` at ${currentPrice.toFixed(2)}. ${comment}\n\n`
            + `:gem: Money: ${txn.startBalance.toFixed(2)} -> **${txn.endBalance.toFixed(2)}**\n`
            + `Owned shares of \`${symbol}\`: ${txn.startShares} -> **${txn.endShares}**\n`
            + `Your average share price: ${txn.startAvg.toFixed(2)} -> **${txn.endAvg.toFixed(2)}**\n`
}

async function handleBuyStocks(user: string, symbol: string, amount: number, channel: TextChannel) {
    const token = process.env.FINNHUB_API_KEY

    if (isNaN(amount)) {
        return channel.send("Please enter a valid number.")
    }

    if (amount <= 0) {
        return channel.send("Number of shares must be greater than zero.")
    }

    let currentPrice: number
    try {
        currentPrice = await getStockPrice(symbol)
    } catch (err) {
        return channel.send("Unable to reach Finnhub API at the moment.")
    }

    if (currentPrice === 0) {
        return channel.send(`Stock with symbol ${symbol} does not exist.`)
    }

    try {
        const result = await sharesDao.buyShares(user, symbol, amount, currentPrice)
        return channel.send(getTransactionString("bought", amount, symbol, currentPrice, result))
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
    
    if (isNaN(amount)) {
        return channel.send("Please enter a valid number.")
    }

    if (amount <= 0) {
        return channel.send("Number of shares must be greater than zero.")
    }

    let currentPrice: number
    try {
        currentPrice = await getStockPrice(symbol)
    } catch (err) {
        return channel.send("Unable to reach Finnhub API at the moment.")
    }

    if (currentPrice === 0) {
        return channel.send(`Stock with symbol \`${symbol}\` does not exist.`)
    }

    try {
        const result = await sharesDao.sellShares(user, symbol, amount, currentPrice)
        return channel.send(getTransactionString("sold", amount, symbol, currentPrice, result))
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
    const nonZeroShares = portfolio.filter((shares: Shares) => shares.amount > 0)
    if (nonZeroShares.length === 0) {
        return channel.send("You do not own any stocks.") 
    }

    const rows = nonZeroShares.map((shares: Shares) => {
        return [ shares.symbol, shares.amount.toString(), shares.averagePrice.toFixed(2) ]
    })
    const headerRow = ["Symbol", "Owned shares", "Average price"]

    const table = generateTable([headerRow].concat(rows), true)
    return channel.send("Your portfolio:\n" + table)
}

function getTotalPortfolioValue(sharesList: Shares[], stockPrices: Map<string, number>) {
    return sharesList.map((shares: Shares) => {
        return shares.amount * stockPrices.get(shares.symbol)!
    }).reduce((a, b) => a + b, 0)
}

async function handlePortfolioValue(user: string, channel: TextChannel) {
    const portfolio: Array<Shares> = await sharesDao.getSharesByUser(user)
    const nonZeroShares = portfolio.filter((shares: Shares) => shares.amount > 0)
    if (nonZeroShares.length === 0) {
        return channel.send("You do not own any stocks.") 
    }
    const symbols = nonZeroShares.map(shares => shares.symbol)

    let stockPrices: Map<string, number>
    try {
        stockPrices = await getCachedStockPrices(symbols)
    } catch (err) {
        return channel.send("Unable to reach Finnhub API at the moment.") 
    }
    
    const rows = nonZeroShares.map((shares: Shares) => {
        const price = stockPrices.get(shares.symbol)!
        return [
            shares.symbol,
            shares.amount.toString(),
            shares.averagePrice.toFixed(2),
            price.toFixed(2),
            (shares.amount * price).toFixed(2)
        ]
    })
    const totalValue = getTotalPortfolioValue(nonZeroShares, stockPrices)

    const headerRow = [
        "Symbol",
        "Owned shares",
        "Average price",
        "Current price",
        "Market value"
    ]
    const fullTable = [headerRow].concat(rows)
    const tableStr = generateTable(fullTable, true)
    return channel.send("Your portfolio:\n" + tableStr + `\nYour total portfolio value: **${totalValue.toFixed(2)}**`)
}

async function handleBaltop(channel: TextChannel) {
    // Retrieve all user balances and shares
    const [balances, shares] = await Promise.all([moneyBalanceDao.getAllBalances(), sharesDao.getAllShares()])

    const balanceMap: Map<string, number> = new Map()
    // Set total balance to current balance. We will add the portfolio value in a bit
    for (const [user, balance] of balances.entries()) {
        balanceMap.set(user, balance.amount)
    }

    // Calculate portfolio value for each user
    const portfolioValueMap: Map<string, number> = new Map()
    for (const [user, sharesList] of shares.entries()) {
        const nonZeroShares = sharesList.filter((shares: Shares) => shares.amount > 0)
        const symbols = nonZeroShares.map(shares => shares.symbol)

        let stockPrices: Map<string, number>
        try {
            stockPrices = await getCachedStockPrices(symbols)
        } catch (err) {
            return channel.send("Unable to reach Finnhub API at the moment.") 
        }
        const totalValue = getTotalPortfolioValue(nonZeroShares, stockPrices)

        portfolioValueMap.set(user, totalValue)
    }

    // Output baltop
    const userData = []
    for (const [user, balance] of balanceMap.entries()) {
        const portfolioValue = portfolioValueMap.has(user) ? portfolioValueMap.get(user)! : 0
        userData.push({
            user,
            balance,
            portfolioValue,
            total: portfolioValue + balance
        })
    }
    // Sort descending
    userData.sort((a, b) => b.total - a.total)

    const header = ["Username", "Money", "Portfolio value", "Total"]
    const rows = await Promise.all(userData.map(async datum => {
        const discordUser = await channel.client.users.fetch(datum.user)
        return [discordUser.username, datum.balance.toFixed(2), datum.portfolioValue.toFixed(2), datum.total.toFixed(2)]
    }))
    return channel.send(generateTable([header].concat(rows), true))
}

async function handleMessage(message: Message) {
    if (!message.channel || !message.member) {
        return
    }

    if (!(message.channel instanceof TextChannel)) {
        return
    }

    if (message.content.startsWith("!baltop")) {
        await handleBaltop(message.channel)
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
            return await handleBuyStocks(message.author.id, args[2].toUpperCase(), parseInt(args[3]), message.channel)
        case "sell":
            if (args.length < 4) {
                return message.channel.send("Usage: \`!stocks sell <symbol> <quantity>\`")
            }
            return await handleSellStocks(message.author.id, args[2].toUpperCase(), parseInt(args[3]), message.channel)
        case "portfolio":
            if (args[2] === "value") {
                return await handlePortfolioValue(message.author.id, message.channel)
            } else {
                return await handlePortfolio(message.author.id, message.channel)
            }
        default:
            return await message.channel.send("Available commands: \`buy, sell, portfolio\`")
    }
}

export const StocksModule: BotModule = (client: Client) => {
    client.on("messageCreate", async message => {
        handleMessage(message)
    })
    console.log("Loaded StocksModule")
}