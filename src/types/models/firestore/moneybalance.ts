import { getFirestoreConnection, getOne } from "../../../utils/db/firestore"
import { MoneyBalance, MoneyBalanceDao, MONEY_COLLECTION_NAME } from '../moneybalance.dao'

function getBalance(user: string): Promise<MoneyBalance> {
    const moneyRef = getFirestoreConnection().collection(MONEY_COLLECTION_NAME)
    return getOne<MoneyBalance>(moneyRef, user)
}

async function initUser(user: string): Promise<void> {
    const moneyRef = getFirestoreConnection().collection(MONEY_COLLECTION_NAME)
    await moneyRef.doc(user).set({ id: user, amount: 10000 })
}

export const MoneyBalanceFirestoreDao: MoneyBalanceDao = {
    getBalance,
    initUser
}