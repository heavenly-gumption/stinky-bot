export type Shares = {
    user: string,
    symbol: string,
    amount: number,
    averagePrice: number
}

export type Transaction = {
    user: string,
    symbol: string,
    time: Date,
    price: number,
    startBalance: number,
    endBalance: number,
    startShares: number,
    endShares: number,
    startAvg: number,
    endAvg: number
}

export const SHARES_COLLECTION_NAME = 'shares'
export const TRANSACTION_COLLECTION_NAME = 'shares-transactions'

export const NOT_ENOUGH_SHARES_ERROR = 'NOT_ENOUGH_SHARES'

export type SharesDao = {
    getAllShares: () => Promise<Map<string, Shares[]>>
    getSharesByUser: (user: string) => Promise<Shares[]>,
    getSharesByUserAndSymbol: (user: string, symbol: string) => Promise<Shares>,
    buyShares: (user: string, symbol: string, amount: number, price: number) => Promise<Transaction>,
    sellShares: (user: string, symbol: string, amount: number, price: number) => Promise<Transaction>
}