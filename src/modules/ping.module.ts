import { BotModule } from "../types"
import { Client, TextChannel } from "discord.js"

export const PingModule: BotModule = (client: Client) => {
    console.log("Loaded PingModule")
    client.on("messageCreate", async message => {
        if (message.channel && message.content === "ping" && message.channel instanceof TextChannel) {
            await message.channel.send("pong")
        }
    })
}