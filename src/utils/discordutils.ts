import { TextChannel } from "discord.js"

const DISCORD_MAX_MESSAGE_LEN = 2000
export async function sendPaginatedMessage(textChannel: TextChannel, message: string, splitOn: string = " ") {
  let i = 0
  while (message.length - i > DISCORD_MAX_MESSAGE_LEN) {
    const lastValidSplitIdx = message.lastIndexOf(splitOn, i + DISCORD_MAX_MESSAGE_LEN)
    await textChannel.send(message.substring(i, lastValidSplitIdx))
    i = lastValidSplitIdx
  }
  await textChannel.send(message.substring(i, message.length))
}