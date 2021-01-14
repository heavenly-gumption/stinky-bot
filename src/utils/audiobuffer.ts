import { PCMBuffer, PCMBufferWriter } from "../types/audiobuffer"
import { Writable } from "stream"
import { FileWriter } from "wav"

const SAMPLE_RATE = 48000
const BIT_DEPTH = 16
const INPUT_CHANNELS = 2
const BYTES_PER_SAMPLE = 2
const MILLIS_PER_SECOND = 1000

const INT_MAX = Math.pow(2, BIT_DEPTH - 1) - 1
const INT_MIN = -Math.pow(2, BIT_DEPTH - 1)

export function timeToOffset(buffer: PCMBuffer, timeOffset: number): number {
    // get current time, modulo to length of buffer
    const now = new Date()
    const seconds = (now.getTime() / MILLIS_PER_SECOND) + timeOffset
    let ptr = Math.floor((seconds % buffer.duration) * buffer.data.length / buffer.duration)
    // make ptr sample + channel aligned
    if (ptr % BYTES_PER_SAMPLE !== 0) {
        ptr -= ptr % BYTES_PER_SAMPLE
    }
    return ptr
}

export function createPCMBuffer(seconds: number): PCMBuffer {
    return {
        data: Buffer.alloc(BYTES_PER_SAMPLE * SAMPLE_RATE * seconds),
        duration: seconds
    }
}

export function createPCMBufferWriter(buffer: PCMBuffer): PCMBufferWriter {
    // get current time, modulo to length of buffer
    const ptr = timeToOffset(buffer, 0)

    return {
        pcmBuffer: buffer,
        ptr: ptr
    }
}

export function addToBuffer(bufferWriter: PCMBufferWriter, chunk: Buffer): void {
    // input comes in 2 channels (l/r), but we're only storing mono.
    // since we're optimizing for standard mics, just grabbing the first channel is fine
    const offset = 0
    for (let offset = 0; offset < chunk.length; offset += 2 * INPUT_CHANNELS) {
        const value = chunk.readInt16LE(offset)
        const buf = bufferWriter.pcmBuffer.data
        const prev = buf.readInt16LE(bufferWriter.ptr)

        const newVal = Math.max(INT_MIN, Math.min(INT_MAX, value + prev))
        buf.writeInt16LE(newVal, bufferWriter.ptr)
        bufferWriter.ptr = (bufferWriter.ptr + BYTES_PER_SAMPLE) % buf.length
    }
}

export function clearBuffer(buffer: PCMBuffer, start: number, end: number): void {
    if (end > start) {
        buffer.data.fill(0, start, end)
    } else {
        buffer.data.fill(0, start, buffer.data.length)
        buffer.data.fill(0, 0, end)
    }
}

export function writeBufferToFile(buffer: PCMBuffer, filename: string, duration: number): void {
    if (duration <= 0) {
        throw "Offset must be greater than 0"
    }

    if (duration >= buffer.duration) {
        throw "Offset must be less than the buffer duration"
    }

    const end = timeToOffset(buffer, 0)
    let start = timeToOffset(buffer, -duration)
    
    // skip buffer silence
    while (start !== end && buffer.data.readInt16LE(start) === 0) {
        start = (start + BYTES_PER_SAMPLE) % buffer.data.length
    }
    
    // create the wav file
    const stream = new FileWriter(filename, {
        sampleRate: SAMPLE_RATE,
        channels: 1,
    })

    if (end > start) {
        // no wrapping
        stream.write(buffer.data.subarray(start, end))
    } else {
        // wraps around
        stream.write(buffer.data.slice(start, buffer.data.length))
        stream.write(buffer.data.slice(0, end))
    }

    stream.end()
}

export function prepareBuffer(buffer: PCMBuffer, duration: number): Buffer {
    if (duration <= 0) {
        throw "Offset must be greater than 0"
    }

    if (duration >= buffer.duration) {
        throw "Offset must be less than the buffer duration"
    }

    const end = timeToOffset(buffer, 0)
    let start = timeToOffset(buffer, -duration)
    
    // skip buffer silence
    while (start !== end && buffer.data.readInt16LE(start) === 0) {
        start = (start + BYTES_PER_SAMPLE) % buffer.data.length
    }

    if (end > start) {
        // no wrapping
        const newBuffer = Buffer.alloc(end - start)
        buffer.data.copy(newBuffer, 0, start, end)
        return newBuffer
    } else {
        // wraps around
        const newBuffer = Buffer.alloc(buffer.data.length - start + end)
        buffer.data.copy(newBuffer, 0, start, buffer.data.length)
        buffer.data.copy(newBuffer, buffer.data.length - start, 0, end)
        return newBuffer
    }
}