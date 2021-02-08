export type VibeHistory = {
    id: string,
    time: number,
    vibe: number
}

export type VibeHistoryDao = {
    getLastNVibes: (id: string, n: number) => Promise<VibeHistory[]>,
    addVibe: (id: string, vibe: number) => Promise<null | void>
}