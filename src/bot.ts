import * as dotenv from "dotenv"

declare let process: {
    env: Environment;
}
dotenv.config()

import { Client } from "discord.js"

import { Environment } from "./types"
import { loadEnabledModules, applyAllModules } from "./modules"

// Initialize environment variables

async function main() {
    Error.stackTraceLimit = Infinity
    
    const client = new Client()
    client.on("ready", async () => {
        const enabledModules = loadEnabledModules()
        console.log("Applying modules")
        await applyAllModules(client, enabledModules)
        console.log("Applied all modules")
        console.log("Logged in!")
    })
    await client.login(process.env.DISCORD_TOKEN)
}

// Only execute the main function here

main()
