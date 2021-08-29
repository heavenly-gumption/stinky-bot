import { Client } from "discord.js"

export const PingModule = (client: Client) => {
    console.log("Loaded PingModule")
    client.on("message", async message => {
        if (message.channel && message.content === "ping") {
            await message.channel.send("pong")
        }
    })
}