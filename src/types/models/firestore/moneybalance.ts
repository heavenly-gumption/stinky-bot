import { getFirestoreConnection, getOne } from "../../../utils/db/firestore"
import { MoneyBalance, MoneyBalanceDao, MONEY_COLLECTION_NAME } from '../moneybalance.dao'

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

export const MoneyBalanceFirestoreDao: MoneyBalanceDao = {
    getBalance,
    getAllBalances,
    initUser
}