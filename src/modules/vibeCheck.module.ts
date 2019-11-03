import { BotModule } from "../types"
import { Client } from "discord.js"

export const VibeCheckModule: BotModule = (client: Client) => {
    console.log("Loaded VibeCheckModule")
    client.on("message", async message => {
        if (message.channel && message.content === "vibe check") {
            const vibeCheck = 20
            await message.channel.send("Current Vibe: `" + Math.floor(Math.random() * Math.floor(vibeCheck) + 1) + "`")
        }
    })
}