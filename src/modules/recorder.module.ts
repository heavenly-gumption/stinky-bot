import { BotModule } from "../types"
import { Client, Message, MessageReaction, User, Channel, 
    TextChannel, VoiceChannel, VoiceConnection, Speaking } from "discord.js"
import S3 from "aws-sdk/clients/s3"
import { createPCMBuffer, createPCMBufferWriter, 
    addToBuffer, prepareBuffer, timeToOffset, clearBuffer,
    secondsToSampleAlignedOffset, offsetToSeconds } from "../utils/audiobuffer"
import { PCMBuffer, PCMBufferWriter } from "../types/audiobuffer"
import { Clip, createClip, getClipByName, deleteClipByName, renameClip,
    getAllClips, trimClip } from "../types/models/clip"
import { Readable } from "stream"
import * as fs from "fs"

const BUCKET = "heavenly-gumption-clips"
const FILE_EXT = "pcm"

const CLIP_ID_CHARS = "0123456789abcdef"
const CLIP_ID_LEN = 16

const CLIP_COOLDOWN_SEC = 15

const DEFAULT_BUFFER_LEN_SEC = 120
const BUFFER_LEN_SEC = process.env.RECORDING_BUFFER_LEN 
    ? parseInt(process.env.RECORDING_BUFFER_LEN) : DEFAULT_BUFFER_LEN_SEC
const BUFFER_WRITE_GAP = 5
const BUFFER_WRITE_SEC = BUFFER_LEN_SEC - BUFFER_WRITE_GAP
const MIN_CLIP_LEN_SEC = 10

const CLEAR_INTERVAL_SEC = 1
const MILLIS = 1000

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET
})

type VoiceChannelData = {
    connection: VoiceConnection;
    buffer: PCMBuffer;
    interval: NodeJS.Timeout;
    lastClipTime: Date;
}

const voiceChannels: Map<string, VoiceChannelData> = new Map()
const userState: Map<string, boolean> = new Map()


function randomClipId() {
    let id: string = ""
    for (let i = 0; i < CLIP_ID_LEN; i++) {
        id += CLIP_ID_CHARS[Math.floor(Math.random() * CLIP_ID_CHARS.length)]
    }
    return id
}


async function getClipFromS3(clip: Clip): Promise<Buffer> {
    const params = {
        Bucket: BUCKET,
        Key: `${clip.id}.pcm`,
        Range: `bytes=${clip.clipstart}-${clip.clipend}`
    }

    const data = await s3.getObject(params).promise()
    if (data.Body instanceof Buffer) {
        return data.Body
    } else {
        throw data.Body
    }
}

async function uploadClipToS3(clipId: string, buffer: Buffer): Promise<Record<string, any>> {
    const params = {
        Bucket: BUCKET,
        Key: `${clipId}.${FILE_EXT}`,
        Body: buffer
    }

    // Upload file to S3
    const data = await s3.upload(params).promise()
    return data
}

function onUserChangeState(channelId: string, user: User, speaking: Readonly<Speaking>) {
    // If user is speaking already, return (this event can get fired twice)
    if (userState.get(user.id) && speaking.has(Speaking.FLAGS.SPEAKING)) {
        return
    }

    const channelData = voiceChannels.get(channelId)
    if (!channelData) {
        return
    }

    const connection = channelData.connection
    const buffer = channelData.buffer

    // If a user starts speaking, 
    if (speaking.has(Speaking.FLAGS.SPEAKING)) {
        userState.set(user.id, true)
        const audio = connection.receiver.createStream(user, {mode: "pcm"})
        const writer = createPCMBufferWriter(buffer)
        audio.on("data", (chunk: Buffer) => {
            addToBuffer(writer, chunk)
        })
    }

    // If a user stops speaking, reset the flag
    else if (userState.get(user.id) && !speaking.has(Speaking.FLAGS.SPEAKING)) {
        userState.set(user.id, false)
    }
}

// Join a voice channel and register listeners on user voice connections.
async function joinChannel(channel: VoiceChannel) {
    if (voiceChannels.has(channel.id)) {
        return
    }

    const connection: VoiceConnection = await channel.join()
    const buffer: PCMBuffer = createPCMBuffer(BUFFER_LEN_SEC)

    // Play joining audio so Discord starts sending us data
    connection.play("./yo.wav")
    
    // Register listener
    connection.on("speaking", (user, speaking) => {
        onUserChangeState(channel.id, user, speaking)
    })

    let lastCleared: number = timeToOffset(buffer, CLEAR_INTERVAL_SEC)
    // Start interval to clear buffer
    const interval: NodeJS.Timeout = setInterval(() => {
        const now: number = timeToOffset(buffer, CLEAR_INTERVAL_SEC)
        clearBuffer(buffer, lastCleared, now)
        lastCleared = now
    }, CLEAR_INTERVAL_SEC * MILLIS)

    voiceChannels.set(channel.id, {
        connection: connection,
        buffer: buffer,
        interval: interval,
        lastClipTime: new Date(0)
    })
}

// Leave a voice channel and clean up connections / intervals
async function leaveChannel(channel: VoiceChannel) {
    // always fetch the channel via API as using data from the cache
    // may lead to the bot being stuck in an empty channel
    const fetchedChannel: VoiceChannel = await channel.fetch(true) as VoiceChannel
    const voiceChannelData = voiceChannels.get(channel.id)
    if (voiceChannelData && fetchedChannel.members.size == 1) {
        const connection: VoiceConnection = voiceChannelData.connection
        voiceChannelData.connection.disconnect()
        clearInterval(voiceChannelData.interval)
        voiceChannels.delete(channel.id)
    }
}

async function handleSaveClip(channel: VoiceChannel, clipNameArg: string | undefined, clipDurationArg: string | undefined, textChannel: TextChannel) {
    const voiceChannelData = voiceChannels.get(channel.id)
    if (!voiceChannelData) {
        return
    }

    const clipName: string = clipNameArg ?? Math.floor(new Date().getTime() / MILLIS).toString()
    let duration: number = clipDurationArg ?
        Math.floor(parseFloat(clipDurationArg)) :
        BUFFER_WRITE_SEC

    if (duration < MIN_CLIP_LEN_SEC) {
        textChannel.send(`Note: The minimum clip length is ${MIN_CLIP_LEN_SEC} seconds.`)
        duration = MIN_CLIP_LEN_SEC
    }

    if (duration > BUFFER_WRITE_SEC) {
        textChannel.send(`Note: You can clip up to a maximum of ${BUFFER_WRITE_SEC} seconds.`)
        duration = BUFFER_WRITE_SEC
    }

    const now = new Date()
    if (voiceChannelData.lastClipTime.getTime() + CLIP_COOLDOWN_SEC * MILLIS > now.getTime()) {
        return await textChannel.send("Please wait a few seconds before clipping again.")
    }

    // Prepare buffer for upload
    const buffer: Buffer = prepareBuffer(voiceChannelData.buffer, duration)
    const clipId: string = randomClipId()

    // Upload file to S3
    let data
    try {
        data = await uploadClipToS3(clipId, buffer)
    } catch (err) {
        console.log(err)
        return await textChannel.send("Error uploading file to S3: " + err)
    }

    // Write entry to database
    const clip = {
        id: clipId,
        time: new Date(),
        name: clipName,
        url: data.Location,
        clipstart: 0,
        clipend: buffer.length,
        participants: channel.members.map(member => member.id),
        duration: buffer.length
    }

    try {
        await createClip(clip)
        voiceChannelData.lastClipTime = now
        await textChannel.send(`Saved clip with name ${clipName}`)
    } catch (err) {
        // try inserting with name-timestamp
        clip.name = clip.name + "-" + Math.floor(now.getTime() / MILLIS)
        try {
            await createClip(clip)
            voiceChannelData.lastClipTime = now
            await textChannel.send(`Saved clip with name ${clip.name}`)
        } catch (err) {
            console.log(err)
        }
    }
}

async function handlePlayClip(channel: VoiceChannel, clipName: string, textChannel: TextChannel) {
    const voiceChannelData = voiceChannels.get(channel.id)
    if (!voiceChannelData) {
        return
    }

    let clip
    try {
        clip = await getClipByName(clipName)
    } catch (err) {
        return await textChannel.send("Could not find a clip with that name.")
    }

    let buffer
    try {
        buffer = await getClipFromS3(clip)
        // data from s3 is stored in single channel. need to convert to stereo
        const converted = Buffer.alloc(buffer.length * 2)
        for (let i = 0; i < buffer.length; i += 2) {
            converted[i * 2] = buffer[i]
            converted[i * 2 + 1] = buffer[i + 1]
            converted[i * 2 + 2] = buffer[i]
            converted[i * 2 + 3] = buffer[i + 1]
        }

        const readable = new Readable({
            read() {
                readable.push(converted)
                readable.push(null)
            }
        })

        voiceChannelData.connection.play(readable, {type: "converted"})
    } catch (err) {
        console.log(err)
    }
}

async function handleListClips(textChannel: TextChannel) {
    const clips = await getAllClips()
    return await textChannel.send(clips.map(c => c.name).sort().join(", "))
}

async function handleRenameClip(oldName: string, newName: string, textChannel: TextChannel) {
    try {
        const clip = await getClipByName(oldName)
        try {
            await renameClip(oldName, newName)
            return await textChannel.send(`Successfully renamed clip ${oldName} to ${newName}.`)
        } catch (err) {
            return await textChannel.send("Clip with that name already exists.")
        }
        await textChannel.send(`Successfully renamed clip ${oldName} to ${newName}.`)
    } catch(err) {
        return await textChannel.send("Could not find a clip with that name.")
    }
}

async function handleDeleteClip(clipName: string, requester: string, textChannel: TextChannel) {
    let clip
    try {
        clip = await getClipByName(clipName)
    } catch (err) {
        return await textChannel.send("Could not find a clip with that name.")
    }

    if (!clip.participants.includes(requester)) {
        return await textChannel.send("You were not in this clip and cannot delete it.")
    }

    const params = {
        Bucket: BUCKET,
        Key: `${clip.id}.pcm`
    }

    try {
        await s3.deleteObject(params).promise()
        await deleteClipByName(clipName)
        await textChannel.send(`Deleted clip ${clipName}`)
    } catch (err) {
        console.log(err)
    }
}

async function handleTrimClip(clipName: string, start: number, end: number, textChannel: TextChannel) {
    let clip
    try {
        clip = await getClipByName(clipName)
    } catch (err) {
        return await textChannel.send("Could not find a clip with that name.")
    }

    const duration = offsetToSeconds(clip.duration)

    // if end was not passed in (NaN), assume end === duration
    if (!end) {
        end = duration
    }

    // convert negative numbers to (duration - n)
    if (start < 0) {
        start = duration + start
    }

    if (end < 0) {
        end = duration + end
    }

    // reject if start > duration
    if (start > duration) {
        return await textChannel.send(`Start time is after the end of the clip (${duration.toFixed(1)})`)
    }


    if (start >= end) {
        return await textChannel.send("Start time must be before end time.")
    }

    const startByte = Math.max(0, secondsToSampleAlignedOffset(start))
    const endByte = Math.min(clip.duration, secondsToSampleAlignedOffset(end))


    await trimClip(clipName, startByte, endByte)
    await textChannel.send(`Trimmed clip ${clipName}.`)
}

async function handleMessage(message: Message) {
    if (!message.channel || !message.member) {
        return
    }

    if (!(message.channel instanceof TextChannel)) {
        return
    }

    if (message.content.startsWith("!play")) {
        if (message.member.voice.channel) {
            const args = message.content.split(" ")
            if (args.length < 2) {
                return
            }
            const name = args[1]
            await handlePlayClip(message.member.voice.channel, name, message.channel)
        }
    }

    else if (message.content.startsWith("!clipit")) {
        // member must be in the voice channel
        if (message.member.voice.channel && voiceChannels.has(message.member.voice.channel.id)) {
            const args = message.content.split(" ")
            
            await handleSaveClip(message.member.voice.channel, args[1], args[2], message.channel)
        } else {
            await message.channel.send("You must be in the recording channel to save a clip.")
        }
    }

    else if (message.content.startsWith("!clip")) {
        const args = message.content.split(" ")
        const command = args[1]
        switch (command) {
            // !clip list
            case "list":
                await handleListClips(message.channel)
                break

            // !clip rename <old> <new>
            case "rename":
                await handleRenameClip(args[2], args[3], message.channel)
                break

            // !clip delete <name>
            case "delete":
                await handleDeleteClip(args[2], message.author.id, message.channel)
                break

            // !clip trim <name> <start> <end>
            case "trim":
                await handleTrimClip(args[2], parseFloat(args[3]), parseFloat(args[4]), message.channel)
                break

            // by default, assume they meant to type !clipit
            default:
                if (message.member.voice.channel) {
                    await handleSaveClip(message.member.voice.channel, args[1], args[2], message.channel)
                }
        }
    }
}

export const RecorderModule: BotModule = (client: Client) => {
    console.log("Loaded RecorderModule")

    client.on("message", async (message: Message) => {
        handleMessage(message)
    })

    client.on("voiceStateUpdate", async (oldMember, newMember) => {
        // ignore self state updates
        if (client.user && oldMember.id === client.user.id) {
            return
        }

        const newUserChannel: VoiceChannel | null = newMember.channel
        const oldUserChannel: VoiceChannel | null = oldMember.channel

        // User joined voice channel
        if (newUserChannel && newUserChannel.id === process.env.VOICE_CHANNEL) {
            await joinChannel(newUserChannel)
        }

        // User left voice channel
        else if (oldUserChannel && newUserChannel != oldUserChannel && oldUserChannel.id === process.env.VOICE_CHANNEL) {
            await leaveChannel(oldUserChannel)
        }
    })
}