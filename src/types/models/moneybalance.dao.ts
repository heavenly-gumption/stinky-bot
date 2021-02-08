export type MoneyBalance = {
    id: string,
    amount: number
}

export type MoneyBalanceDao = {
    getBalance: (user: string) => Promise<MoneyBalance>,
    initUser: (user: string) => Promise<null>
}