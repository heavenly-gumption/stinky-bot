import * as dotenv from "dotenv"
import { Client } from "discord.js"

import { BotModule, HOCModule, Environment } from "./types"
import { loadEnabledModules, applyAllModules } from "./modules"

// Initialize environment variables

declare let process: {
    env: Environment;
}
dotenv.config()

async function main() {
    console.log("Hello world")
    const client = new Client()
    const enabledModules = loadEnabledModules()
    console.log("Applying modules")
    await applyAllModules(client, enabledModules)
    console.log("Applied all modules")
    client.login(process.env.DISCORD_TOKEN)
}

// Only execute the main function here

main()
