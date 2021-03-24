import { getFirestoreConnection, getOne } from "../../../utils/db/firestore"
import { MoneyBalance, MoneyBalanceDao, MONEY_COLLECTION_NAME,
    BALANCE_UNINITIALIZED_ERROR, LOW_BALANCE_ERROR } from '../moneybalance.dao'

function getBalance(user: string): Promise<MoneyBalance> {
    const moneyRef = getFirestoreConnection().collection(MONEY_COLLECTION_NAME)
    return getOne<MoneyBalance>(moneyRef, user)
}

async function getAllBalances(): Promise<Map<string, MoneyBalance>> {
    const moneyRef = getFirestoreConnection().collection(MONEY_COLLECTION_NAME)
    const snapshot = await moneyRef.get()
    const res: Map<string, MoneyBalance> = new Map()
    snapshot.forEach(doc => {
        res.set(doc.id, doc.data() as MoneyBalance)
    })
    return res
}

async function initUser(user: string): Promise<void> {
    const moneyRef = getFirestoreConnection().collection(MONEY_COLLECTION_NAME)
    await moneyRef.doc(user).set({ id: user, amount: 10000 })
}

async function transfer(from: string, to: string, amount: number): Promise<void> {
    const db = getFirestoreConnection()
    const fromDocRef = db.collection(MONEY_COLLECTION_NAME).doc(from)
    const toDocRef = db.collection(MONEY_COLLECTION_NAME).doc(to)

    await db.runTransaction(async (t) => {
        const fromDoc = await t.get(fromDocRef)
        const toDoc = await t.get(toDocRef)
        if (!fromDoc.exists || !toDoc.exists) {
            throw BALANCE_UNINITIALIZED_ERROR
        }

        const fromMoney: MoneyBalance = fromDoc.data() as MoneyBalance
        const toMoney: MoneyBalance = toDoc.data() as MoneyBalance
        if (fromMoney.amount < amount) {
            throw LOW_BALANCE_ERROR
        }

        t.update(fromDocRef, { amount: fromMoney.amount - amount })
        t.update(toDocRef, { amount: toMoney.amount + amount })
    })
}

export const MoneyBalanceFirestoreDao: MoneyBalanceDao = {
    getBalance,
    getAllBalances,
    initUser,
    transfer
}