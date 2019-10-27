import { Client } from "discord.js";

export type BotModule = (client: Client) => void
export type HOCModule = (module: HOCModule) => BotModule | HOCModule