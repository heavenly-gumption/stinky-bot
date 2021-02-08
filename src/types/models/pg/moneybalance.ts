import { getPgConnection } from '../../../utils/db/pg'
import { MoneyBalance, MoneyBalanceDao } from '../moneybalance.dao'

const db = getPgConnection()

function getBalance(user: string): Promise<MoneyBalance> {
    return db.one('SELECT * FROM MoneyBalance WHERE id = $1', [user]);
}

function initUser(user: string): Promise<null> {
    return db.none('INSERT INTO MoneyBalance VALUES ($1, 100)', [user]);
}

export const MoneyBalancePgDao : MoneyBalanceDao = {
    getBalance,
    initUser
}