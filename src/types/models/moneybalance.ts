import { db }  from '../../utils/db'

interface MoneyBalance {
    id: string,
    amount: number
}

export function getBalance(user: string): Promise<MoneyBalance> {
    return db.one('SELECT * FROM MoneyBalance WHERE id = $1', [user]);
}

export function initUser(user: string): Promise<null> {
    return db.none('INSERT INTO MoneyBalance VALUES ($1, 100)', [user]);
}