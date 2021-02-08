export type Chats = {
    id: number,
    log: string
}

export type ChatsDao = {
    getLog: (id: number) => Promise<Chats>
}