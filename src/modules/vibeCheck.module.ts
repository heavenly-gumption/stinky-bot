import { BotModule } from "../types"
import { Client } from "discord.js"

export const VibeCheckModule: BotModule = (client: Client) => {
    console.log("Loaded VibeCheckModule")
    client.on("message", async message => {
        if (message.channel && message.content === "vibe check") {
            let vibe = Math.floor(Math.random() * 420 + 1)
            let message = ""
            if (vibe === 420) {
            	message = "Dank Vibe: `" + vibe + "`"
            } else if (vibe === 69) {
            	message = "Sexy Wexy Vibey Wibey UwU: `" + vibe + "`"
            } else {
            	message = "Current Vibe: `" + (Math.floor(vibe / 21) + 1) + "`"
            }
            await message.channel.send(message)
        }
    })
}