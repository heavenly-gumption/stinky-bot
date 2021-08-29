import { Client } from "discord.js"

import { BaseModule } from "./base.module"
import { PingModule } from "./ping.module"
import { VibeCheckModule } from "./vibeCheck.module"
import { MoneyModule } from "./money.module"
import { TriviaModule } from "./trivia.module"
import { ReminderModule } from "./reminder.module"
import { MathModule } from "./math.module"
import { RecorderModule } from "./recorder.module"
import { LuisModule } from "./luis.module"
import { StocksModule } from "./stocks.module"
import { getMoneyBalanceDao } from "../utils/model"
import { moneyService } from "../services/money"

const GET_MODULES = () => [
    BaseModule,
    PingModule,
    VibeCheckModule,
    MoneyModule,
    TriviaModule,
    ReminderModule,
    MathModule,
    RecorderModule,
    LuisModule,
    StocksModule
]

export function loadEnabledModules(client: Client) {
    const providers = {
        moneyBalanceDao: getMoneyBalanceDao()
    }
    const services = {
        moneyService: moneyService(providers)
    }
    const modules = GET_MODULES()

    modules.forEach(module => module(client, services))
}