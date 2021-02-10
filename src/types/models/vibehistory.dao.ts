export type VibeHistory = {
    id: string,
    time: Date,
    vibe: number
}

export type VibeHistoryDao = {
    getLastNVibes: (id: string, n: number) => Promise<VibeHistory[]>,
    addVibe: (id: string, vibe: number) => Promise<null | void>
}