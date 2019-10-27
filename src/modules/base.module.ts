import { Client } from "discord.js"

import { BotModule } from "../types/index"

export const BaseModule: BotModule = (client: Client) => {
    console.log("Base module loaded")
}