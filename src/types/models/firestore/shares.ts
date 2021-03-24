import { getFirestoreConnection, getOne, find } from "../../../utils/db/firestore"
import { Shares, Transaction, SharesDao, 
    BALANCE_UNINITIALIZED_ERROR, LOW_BALANCE_ERROR, NOT_ENOUGH_SHARES_ERROR,
    SHARES_COLLECTION_NAME, TRANSACTION_COLLECTION_NAME } from "../shares.dao"
import { MoneyBalance, MoneyBalanceDao, MONEY_COLLECTION_NAME } from '../moneybalance.dao'

function getSharesDocId(user: string, symbol: string): string {
    return user + '-' + symbol
}

function getTransactionDocId(user: string, symbol: string, time: Date): string {
    return user + '-' + symbol + '-' + time.getTime()
}

async function getAllShares(): Promise<Map<string, Shares[]>> {
    const sharesRef = getFirestoreConnection().collection(SHARES_COLLECTION_NAME)
    const snapshot = await sharesRef.get()
    const res: Map<string, Shares[]> = new Map()
    snapshot.forEach(doc => {
        const shares = doc.data() as Shares
        if (res.has(shares.user)) {
            res.get(shares.user)!.push(shares)
        } else {
            res.set(shares.user, [shares])
        }
    })
    return res
}

function getSharesByUser(user: string): Promise<Array<Shares>> {
    const sharesRef = getFirestoreConnection().collection(SHARES_COLLECTION_NAME)
    return find<Shares>(sharesRef, 'user', '==', user)
}

function getSharesByUserAndSymbol(user: string, symbol: string): Promise<Shares> {
    const sharesRef = getFirestoreConnection().collection(SHARES_COLLECTION_NAME)
    return getOne<Shares>(sharesRef, getSharesDocId(user, symbol))
}

async function buyShares(user: string, symbol: string, amount: number, price: number): Promise<Transaction> {
    const db = getFirestoreConnection()
    const time = new Date()
    const sharesDocRef = db.collection(SHARES_COLLECTION_NAME).doc(getSharesDocId(user, symbol))
    const moneyDocRef = db.collection(MONEY_COLLECTION_NAME).doc(user)
    const transactionDocRef = db.collection(TRANSACTION_COLLECTION_NAME).doc(getTransactionDocId(user, symbol, time))

    try {
        const res: Transaction = await db.runTransaction(async (t) => {
            const sharesDoc = await t.get(sharesDocRef)
            const moneyDoc = await t.get(moneyDocRef)
            // Throw error if user's moneybalance is not initialized
            if (!moneyDoc.exists) {
                throw { type: BALANCE_UNINITIALIZED_ERROR }
            }

            const money: MoneyBalance = moneyDoc.data() as MoneyBalance
            // Throw error if not enough money
            if (money.amount < amount * price) {
                throw {
                    type: LOW_BALANCE_ERROR,
                    balance: money.amount,
                    needed: amount * price
                }
            }

            const startBalance = money.amount
            const endBalance = startBalance - amount * price
            let startShares, endShares, startAvg, endAvg

            // Update the shares ownership for the user
            if (sharesDoc.exists) {
                const shares: Shares = sharesDoc.data() as Shares
                startShares = shares.amount
                endShares = startShares + amount
                startAvg = shares.averagePrice
                endAvg = (startAvg * startShares + price * amount) / endShares

                t.update(sharesDocRef, {
                    amount: endShares,
                    averagePrice: endAvg
                })
            } else {
                startShares = 0
                endShares = amount
                startAvg = 0
                endAvg = price
                t.set(sharesDocRef, { user: user, symbol: symbol, amount: amount, averagePrice: price })
            }

            // Update the money balance for the user
            t.update(moneyDocRef, { amount: endBalance })

            // Write a shares transaction and return it
            const sharesTransaction: Transaction = {
                user,
                symbol,
                time,
                price,
                startBalance,
                endBalance,
                startShares,
                endShares,
                startAvg,
                endAvg
            }
            t.set(transactionDocRef, sharesTransaction)
            return sharesTransaction
        })
        return res
    } catch (e) {
        throw e
    }
}

async function sellShares(user: string, symbol: string, amount: number, price: number): Promise<Transaction> {
    const db = getFirestoreConnection()
    const time = new Date()
    const sharesDocRef = db.collection(SHARES_COLLECTION_NAME).doc(getSharesDocId(user, symbol))
    const moneyDocRef = db.collection(MONEY_COLLECTION_NAME).doc(user)
    const transactionDocRef = db.collection(TRANSACTION_COLLECTION_NAME).doc(getTransactionDocId(user, symbol, time))

    try {
        const res: Transaction = await db.runTransaction(async (t) => {
            const sharesDoc = await t.get(sharesDocRef)
            const moneyDoc = await t.get(moneyDocRef)
            // Throw error if user's moneybalance is not initialized
            if (!moneyDoc.exists) {
                throw { type: BALANCE_UNINITIALIZED_ERROR }
            }

            // Throw error if shares doc does not exist
            if (!sharesDoc.exists) {
                throw {
                    type: NOT_ENOUGH_SHARES_ERROR,
                    amount: 0
                }
            }

            // Throw error if user does not own enough shares
            const shares: Shares = sharesDoc.data() as Shares
            if (shares.amount < amount) {
                throw {
                    type: NOT_ENOUGH_SHARES_ERROR,
                    amount: shares.amount
                }
            }

            const money: MoneyBalance = moneyDoc.data() as MoneyBalance
            const startBalance = money.amount
            const endBalance = startBalance + amount * price
            const startShares = shares.amount
            const endShares = startShares - amount
            const startAvg = shares.averagePrice
            const endAvg = shares.averagePrice

            // Update the shares ownership for the user
            t.update(sharesDocRef, { amount: endShares })

            // Update the money balance for the user
            t.update(moneyDocRef, { amount: endBalance })

            // Write a shares transaction and return it
            const sharesTransaction: Transaction = {
                user,
                symbol,
                time,
                price,
                startBalance,
                endBalance,
                startShares,
                endShares,
                startAvg,
                endAvg
            }
            t.set(transactionDocRef, sharesTransaction)
            return sharesTransaction
        })
        return res
    } catch (e) {
        throw e
    }
}

export const SharesFirestoreDao: SharesDao = {
    getAllShares,
    getSharesByUser,
    getSharesByUserAndSymbol,
    buyShares,
    sellShares
}