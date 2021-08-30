import { BotModule } from "../types"
import { DotaPlayer } from "../types/models/dotaplayers.dao"
import { GetMatchHistoryResponse, MatchDetails } from "../types/steam/steam"

import { Client, GuildMember, Message, TextChannel, MessageEmbed } from "discord.js"

import { getDotaPlayerDao } from "../utils/model"
import { steamService } from "../services/steam/steam.service"

import { CronJob } from "cron"

// Cached hero names
let _heroNames: undefined | Map<number, string> = undefined
async function getDotaHeroNames(): Promise<Map<number, string>> {
    if (_heroNames) {
        return _heroNames
    }
    _heroNames = new Map<number, string>()
    const heroesResponse = await steamService().getHeroes()
    for (const hero of heroesResponse.result.heroes) {
        _heroNames.set(hero.id, hero.name)
    }
    return _heroNames
}

function formatTime(durationSec: number): string {
    const mins = Math.floor(durationSec / 60)
    const sec = durationSec % 60
    return `${mins}:${sec.toString().padStart(2, "0")}`
}

async function register(member: GuildMember, channel: TextChannel, steamId: string) {
    await getDotaPlayerDao().registerPlayer(member.id, steamId)
    await channel.send(`Registered <@${member.id}> to steam id ${steamId}`)
}

async function runUpdate(channel: TextChannel) {
    const players = await getDotaPlayerDao().getAllPlayers()
    const steamToDiscordId = new Map<string, string>()
    const steamIds = new Set<string>()
    const heroes = await getDotaHeroNames()

    const matchesToParse = new Map<number, MatchDetails>()
    const updatePromises = []
    for (const [key, player] of players) {
        // construct helper data structures
        steamIds.add(player.steamId)
        steamToDiscordId.set(player.steamId, key)

        const matches = await steamService().getMatchHistory(player.steamId, 1)
        const match = matches.result.matches[0]

        // Update lastMatchId if there is a new match, and add it to the list of matches to parse
        if (match.match_id > player.lastMatchId) {
            const promise = getDotaPlayerDao().setLastMatchId(key, match.match_id)
            updatePromises.push(promise)
            const matchDetails = await steamService().getMatchDetails(match.match_id.toString())
            matchesToParse.set(match.match_id, matchDetails.result)
        }
    }

    matchesToParse.forEach(async (match, matchId) => {
        const playersInGame = match.players.filter(p => steamIds.has(p.account_id.toString()))
        const steamIdsInGame = playersInGame.map(p => p.account_id.toString())
        const teamThatWon = match.radiant_win ? "Radiant" : "Dire"

        const radiantPlayers = match.players.filter(p => p.player_slot < 5)
            .filter(p => steamIdsInGame.includes(p.account_id.toString()))
        const playerWon = radiantPlayers.length > 0 && match.radiant_win || radiantPlayers.length === 0 && !match.radiant_win

        const matchSummary = `**${teamThatWon} Victory | ${match.radiant_score} - ${match.dire_score} | ${formatTime(match.duration)}**`
        const playersList = steamIdsInGame.map(steamId => steamToDiscordId.get(steamId))
            .map(discordId => `<@${discordId}>`)
            .join(",")

        // select random hero from the players in the game
        const heroId = playersInGame[Math.floor(Math.random() * playersInGame.length)].hero_id
        const fullHeroName = heroes.get(heroId)
        const heroName = fullHeroName ? fullHeroName.substring(fullHeroName.lastIndexOf("_") + 1) : ""
        const heroIconUrl = `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroName}.png`

        const embed = new MessageEmbed()
            .setColor(playerWon ? "0x00ff00" : "0xff0000")
            .setTitle(`Dota 2 - Match ${match.match_id}`)
            .setDescription(matchSummary + "\n\n" + playersList + " " + (playerWon ? "won" : "lost") + " a game of Dota!")
            .setURL(`https://www.opendota.com/matches/${match.match_id}`)
            .setThumbnail(heroIconUrl)
        await channel.send(embed)
    })

    // Cleanup
    for (const promise of updatePromises) {
        await promise
    }
}

async function handleMessage(message: Message) {
    if (!message.channel || !message.member) {
        return
    }

    if (!(message.channel instanceof TextChannel)) {
        return
    }

    if (message.content.startsWith("!dota")) {
        const args = message.content.split(" ")
        const command = args[1]
        switch (command) {
            // !dota test
            case "test":
                await runUpdate(message.channel)
                break
            // !dota register
            case "register":
                await register(message.member, message.channel, args[2])
                break
        }
    }

    if (!message.content.startsWith("!stocks")) {
        return
    }
}

export const DotaModule: BotModule = (client: Client) => {
    client.on("message", async message => {
        handleMessage(message)
    })

    // Every minute, poll for new games
    const job = new CronJob("0 * * * * *", async () => {
        const channel = await client.channels.fetch(process.env.DOTA_CHANNEL || "")
        await runUpdate(channel as TextChannel)
    })
    job.start()

    console.log("Loaded DotaModule")
}