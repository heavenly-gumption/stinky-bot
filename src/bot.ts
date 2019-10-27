import * as dotenv from "dotenv"
import { Client } from "discord.js"

import { Environment } from "./types"
import { loadEnabledModules, applyAllModules } from "./modules"

// Initialize environment variables

declare let process: {
    env: Environment;
}
dotenv.config()

async function main() {
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
