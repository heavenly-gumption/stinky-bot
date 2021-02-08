import { getFirestoreConnection, getOne } from "../../../utils/db/firestore"
import { MoneyBalance, MoneyBalanceDao } from '../moneybalance.dao'

function getBalance(user: string): Promise<MoneyBalance> {
    const moneyRef = getFirestoreConnection().collection('moneybalance')
    return getOne<MoneyBalance>(moneyRef, user)
}

async function initUser(user: string): Promise<void> {
    const moneyRef = getFirestoreConnection().collection('moneybalance')
    await moneyRef.doc(user).set({ id: user, amount: 100 })
}

export const MoneyBalanceFirestoreDao: MoneyBalanceDao = {
    getBalance,
    initUser
}