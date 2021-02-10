export type Clip = {
    id: string,
    time: Date,
    name: string,
    url: string,
    clipstart: number,
    clipend: number,
    participants: string[],
    duration: number
}

export type ClipDao = {
    getClip: (id: string) => Promise<Clip>,
    getClipByName: (name: string) => Promise<Clip>,
    getAllClips: () => Promise<Array<Clip>>,
    deleteClipByName: (name: string) => Promise<null | void>,
    createClip: (clip: Clip) => Promise<null | void>,
    renameClip: (oldName: string, newName: string) => Promise<null | void>,
    trimClip: (name: string, start: number, end: number) => Promise<null | void>
}