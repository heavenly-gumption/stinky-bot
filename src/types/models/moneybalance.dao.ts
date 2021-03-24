export type MoneyBalance = {
    id: string,
    amount: number
}

export const MONEY_COLLECTION_NAME = 'moneybalance'
export const BALANCE_UNINITIALIZED_ERROR = 'BALANCE_NOT_INITIALIZED'
export const LOW_BALANCE_ERROR = 'LOW_BALANCE'

export type MoneyBalanceDao = {
    getBalance: (user: string) => Promise<MoneyBalance>,
    getAllBalances: () => Promise<Map<string, MoneyBalance>>
    initUser: (user: string) => Promise<null | void>
    transfer: (from: string, to: string, amount: number) => Promise<null | void>
}