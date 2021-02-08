import { getFirestoreConnection, getOne, set } from "../../../utils/db/firestore"
import { MoneyBalance, MoneyBalanceDao } from '../moneybalance.dao'

const db = getFirestoreConnection()
const moneyRef = db.collection('moneybalance')

function getBalance(user: string): Promise<MoneyBalance> {
    return getOne<MoneyBalance>(moneyRef, user)
}

function initUser(user: string): Promise<null> {
    return set<MoneyBalance>(moneyRef, user, { id: user, amount: 100 })
}

export const MoneyBalanceFirestoreDao: MoneyBalanceDao = {
    getBalance,
    initUser
}