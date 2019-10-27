import { Client } from "discord.js"

import { BotModule, HOCModule } from "./types"
import { loadEnabledModules, applyAllModules } from "./modules"

async function main() {
    console.log("Hello world")
    const client = new Client()
    console.log("Hello world 2")
    const enabledModules = loadEnabledModules()
    console.log({enabledModules})
    applyAllModules(client, enabledModules)
}

// Only execute the main function here

main()
