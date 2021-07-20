import { getPgConnection } from '../../../utils/db/pg'
import { MoneyBalance, MoneyBalanceDao } from '../moneybalance.dao'

function getBalance(user: string): Promise<MoneyBalance> {
    const db = getPgConnection()
    return db.one('SELECT * FROM MoneyBalance WHERE id = $1', [user]);
}

function getAllBalances(): Promise<Map<string, MoneyBalance>> {
    throw "NOT IMPLEMENTED"
}

function initUser(user: string): Promise<null> {
    const db = getPgConnection()
    return db.none('INSERT INTO MoneyBalance VALUES ($1, 100)', [user]);
}

function transfer(from: string, to: string, amount: number): Promise<void> {
    throw "NOT IMPLEMENTED"
}

export const MoneyBalancePgDao : MoneyBalanceDao = {
    getBalance,
    getAllBalances,
    initUser,
    transfer
}