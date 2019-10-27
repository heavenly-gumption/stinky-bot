import { Client } from "discord.js"

import { BotModule } from "../types"
import { BaseModule } from "./base.module"
import { PingModule } from "./ping.module"
import { PlayStatusModule } from "./play-status.module"

export function makeModulePath(moduleName: string): string {
    return `${moduleName}.module.js`
}

export function loadEnabledModules(): BotModule[] {
    return [
        BaseModule,
        PingModule,
        PlayStatusModule
    ]
}

export async function applyAllModules(client: Client, modules: BotModule[]) {
    modules.forEach( module => {
        module(client)
    })
}