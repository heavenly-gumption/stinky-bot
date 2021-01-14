import { BotModule } from "../types"
import { Client, Message, MessageReaction, User, Channel, 
    TextChannel, VoiceChannel, VoiceConnection, Speaking } from "discord.js"
import S3 from "aws-sdk/clients/s3"
import { createPCMBuffer, createPCMBufferWriter, 
    addToBuffer, prepareBuffer, timeToOffset, clearBuffer } from "../utils/audiobuffer"
import { PCMBuffer, PCMBufferWriter } from "../types/audiobuffer"
import { Clip, createClip, getClipByName, deleteClipByName, renameClip,
    getAllClips } from "../types/models/clip"
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

function randomClipId() {
    let id: string = ""
    for (let i = 0; i < CLIP_ID_LEN; i++) {
        id += CLIP_ID_CHARS[Math.floor(Math.random() * CLIP_ID_CHARS.length)]
    }
    return id
}

async function saveClip(channel: VoiceChannel, clipName: string, textChannel: TextChannel) {
    const voiceChannelData = voiceChannels.get(channel.id)
    if (!voiceChannelData) {
        return
    }

    const now = new Date()
    if (voiceChannelData.lastClipTime.getTime() + CLIP_COOLDOWN_SEC * MILLIS > now.getTime()) {
        return await textChannel.send("Please wait a few seconds before clipping again.")
    }

    // Prepare buffer for upload
    const buffer: Buffer = prepareBuffer(voiceChannelData.buffer, BUFFER_WRITE_SEC)
    const clipId: string = randomClipId()
    const name = clipName ? clipName : clipId
    const params = {
        Bucket: BUCKET,
        Key: `${clipId}.${FILE_EXT}`,
        Body: buffer
    }

    // Upload file to S3
    s3.upload(params, (err: Error, data: Record<string, any>) => {
        if (err) {
            console.log(err)
            return
        }

        // Write entry to database
        const clip = {
            id: clipId,
            time: new Date(),
            name: name,
            url: data.Location,
            clipstart: 0,
            clipend: buffer.length,
            participants: channel.members.map(member => member.id)
        }

        createClip(clip).then(async res => {
            voiceChannelData.lastClipTime = now
            await textChannel.send(`Saved clip with name ${name}`)
        })
        .catch(err => {
            // try inserting with name-timestamp
            clip.name = clip.name + "-" + Math.floor(now.getTime() / MILLIS)
            createClip(clip).then(async res => {
                voiceChannelData.lastClipTime = now
                await textChannel.send(`Saved clip with name ${clip.name}`)
            }).catch(err => {
                console.log(err)
            })
        })
    })
}

async function getClipFromS3(clip: Clip): Promise<Buffer> {
    const params = {
        Bucket: BUCKET,
        Key: `${clip.id}.pcm`,
        Range: `bytes=${clip.clipstart}-${clip.clipend}`
    }

    return new Promise<Buffer>((resolve, reject) => {
        s3.getObject(params, (err, data) => {
            if (err) {
                reject(err)
            } else if (!(data.Body instanceof Buffer)) {
                reject(data.Body)
            } else {
                resolve(data.Body)
            }
        })
    })
    
}

async function playClip(channel: VoiceChannel, clipName: string, textChannel: TextChannel) {
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

    getClipFromS3(clip).then(buffer => {
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
    }).catch(err => {
        console.log(err)
    })
}

async function handleListClips(textChannel: TextChannel) {
    const clips = await getAllClips()
    return await textChannel.send(clips.map(c => c.name).sort().join(", "))
}

async function handleRenameClip(oldName: string, newName: string, textChannel: TextChannel) {
    getClipByName(oldName).then(async clip => {
        renameClip(oldName, newName).then(async () => {
            return await textChannel.send(`Successfully renamed clip ${oldName} to ${newName}.`)
        }).catch(async err => {
            return await textChannel.send("Clip with that name already exists.")
        })
    }).catch(async err => {
        return await textChannel.send("Could not find a clip with that name.")
    })
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

    s3.deleteObject(params, async (err, data) => {
        if (err) {
            console.log(err)
        } else {
            await deleteClipByName(clipName)
            await textChannel.send(`Deleted clip ${clipName}`)
        }
    })
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
            await playClip(message.member.voice.channel, name, message.channel)
        }
    }

    else if (message.content.startsWith("!clipit")) {
        // member must be in the voice channel
        if (message.member.voice.channel && voiceChannels.has(message.member.voice.channel.id)) {
            const args = message.content.split(" ")
            const clipName: string = args.length === 1 ? 
                Math.floor(new Date().getTime() / MILLIS) + "" : 
                args[1]
            await saveClip(message.member.voice.channel, clipName, message.channel)
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
                await handleRenameClip(args[1], args[2], message.channel)
                break

            // !clip delete <name>
            case "delete":
                await handleDeleteClip(args[2], message.author.id, message.channel)
                break

            // !clip trim <name> <start> <end>
            case "trim":
                // TODO
                break
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
        if (newUserChannel && newUserChannel.id === "796162018263826432") {
            await joinChannel(newUserChannel)
        }

        // User left voice channel
        else if (!newUserChannel && oldUserChannel && oldUserChannel.id === "796162018263826432") {
            await leaveChannel(oldUserChannel)
        }
    })
}