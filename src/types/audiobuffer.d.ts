export type PCMBuffer = {
    data: Buffer,
    duration: number
}

export type PCMBufferWriter = {
    pcmBuffer: PCMBuffer
    ptr: number
}