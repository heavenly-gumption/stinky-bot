export type MoneyBalance = {
    id: string,
    amount: number
}

export const MONEY_COLLECTION_NAME = 'moneybalance'

export type MoneyBalanceDao = {
    getBalance: (user: string) => Promise<MoneyBalance>,
    initUser: (user: string) => Promise<null | void>
}