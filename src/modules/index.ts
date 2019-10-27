import { Client } from "discord.js"

import { BotModule } from "../types"
import { BaseModule } from "./base.module"

type ModuleType = {
    default: BotModule;
}
export function makeModulePath(moduleName: string): string {
    return `${moduleName}.module.js`
}

export function loadEnabledModules(): BotModule[] {
    return [
        BaseModule
    ]
}

export function applyAllModules(client: Client, modules: BotModule[]) {
    modules.forEach( module => {
        module(client)
    })
}