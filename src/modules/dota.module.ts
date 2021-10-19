import { CronJob } from "cron"
import { Client, GuildMember, Message, TextChannel, MessageEmbed } from "discord.js"

import { BotModule } from "../types"
import { DotaPlayer } from "../types/models/dotaplayers.dao"
import { Match, LobbyType, gameModeToString } from "../types/services/opendota/opendota"

import { steamService } from "../services/steam/steam.service"
import { openDotaService } from "../services/opendota/opendota.service"

import { getDotaPlayerDao } from "../utils/model"
import { generateTable } from "../utils/table"

const MENTION_PATTERN = /<@!(\d+)>/

type MMRUpdate = {
    discordId: string;
    oldMMR: number;
    newMMR: number;
}

function formatTime(durationSec: number): string {
    const mins = Math.floor(durationSec / 60)
    const sec = durationSec % 60
    return `${mins}:${sec.toString().padStart(2, "0")}`
}

async function register(member: GuildMember, channel: TextChannel, steamId: string) {
    const matches = await steamService().getMatchHistory(steamId, 1)
    const match = matches.result.matches[0]
    await getDotaPlayerDao().registerPlayer(member.id, member.user.username, steamId, match.match_id)
    await channel.send(`Registered <@${member.id}> to steam id ${steamId}.`)
}

async function unregister(member: GuildMember, channel: TextChannel) {
    await getDotaPlayerDao().unregisterPlayer(member.id)
    await channel.send(`Unregistered <@${member.id}>.`)
}

async function setMMR(member: GuildMember, channel: TextChannel, mmr: number) {
    if (mmr < 0) {
        return
    }
    await getDotaPlayerDao().updateMMR(member.id, mmr)
    await channel.send(`Updated <@${member.id}> MMR to ${mmr}.`)
}

async function getMMR(member: GuildMember, channel: TextChannel) {
    let player
    try {
        player = await getDotaPlayerDao().getPlayer(member.id)
    } catch (err) {
        await channel.send("Run `!dota register <steamid>` and `!dota setmmr <mmr>` to get started and calibrate.")
        return
    }
    if (player.mmr === -1) {
        await channel.send("Your MMR is not currently set up; run `!dota setmmr <mmr>` to calibrate.")
        return
    }
    await channel.send(`Your MMR is currently ${player.mmr}.`)
}

function getMMRChange(won: boolean, partySize: number) {
    return (won ? 1 : -1) * (partySize > 1 ? 20 : 30)
}

async function updateMMR(updates: MMRUpdate[]) {
    const promises = []
    for (const update of updates) {
        promises.push(getDotaPlayerDao().updateMMR(update.discordId, update.newMMR))
    }
    for (const promise of promises) {
        await promise
    }
}

async function runUpdate(channel: TextChannel) {
    const players = await getDotaPlayerDao().getAllPlayers()
    const steamToDiscordId = new Map<string, string>()
    const steamIds = new Set<string>()

    const matchesToParse = new Map<number, Match>()
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
            const matchDetails = await openDotaService().getMatch(match.match_id.toString())
            matchesToParse.set(match.match_id, matchDetails)
        }
    }

    matchesToParse.forEach(async (match, matchId) => {
        const playersInGame = match.players
            .filter(p => p.account_id !== null)
            .filter(p => steamIds.has(p.account_id.toString()))
        const steamIdsInGame = playersInGame.map(p => p.account_id.toString())
        const teamThatWon = match.radiant_win ? "Radiant" : "Dire"

        const radiantPlayers = playersInGame.filter(p => p.player_slot < 5)
        const playerWon = radiantPlayers.length > 0 && match.radiant_win || radiantPlayers.length === 0 && !match.radiant_win

        // select random hero from the players in the game as the icon
        const heroId = playersInGame[Math.floor(Math.random() * playersInGame.length)].hero_id
        const hero = await openDotaService().getHero(heroId)
        const heroName = hero ? hero.name.replace("npc_dota_hero_", "") : ""
        const heroIconUrl = `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroName}.png`

        const matchSummary = `**[ ${teamThatWon} Victory | ${match.radiant_score} - ${match.dire_score} | ${formatTime(match.duration)} ]**`
        const playersList = steamIdsInGame.map(steamId => steamToDiscordId.get(steamId))
            .map(discordId => `<@${discordId}>`)
            .join(",")

        const gameType = match.lobby_type === LobbyType.RankedMatchmaking ? "a Ranked" : "an Unranked"
        const gameMode = gameModeToString(match.game_mode)

        let description = `${matchSummary}\n\n${playersList} ${(playerWon ? "won" : "lost")} ${gameType} game of ${gameMode}!`

        // Perform MMR updates for ranked matches, add to description
        if (match.lobby_type === LobbyType.RankedMatchmaking) {
            const updates = playersInGame.map(p => {
                const discordId = steamToDiscordId.get(p.account_id.toString())!
                const oldMMR = players.get(discordId)!.mmr
                if (oldMMR === -1) {
                    return {
                        discordId,
                        oldMMR: -1,
                        newMMR: -1
                    }
                }

                return {
                    discordId,
                    oldMMR,
                    newMMR: oldMMR + getMMRChange(playerWon, p.party_size)
                }
            })

            description += "\n\n**MMR UPDATE**\n\n"
            description += updates.map(update => {
                if (update.oldMMR === -1) {
                    return `<@${update.discordId}>: ??? -> ??? (Run \`!dota setmmr <mmr>\` to start tracking)`
                }
                return `<@${update.discordId}>: ${update.oldMMR} -> ${update.newMMR}`
            }).join("\n")

            updatePromises.push(updateMMR(updates.filter(u => u.oldMMR !== -1)))
        }

        // Assemble and send embed
        const embed = new MessageEmbed()
            .setColor(playerWon ? "0x00ff00" : "0xff0000")
            .setTitle(`Dota 2 - Match ${match.match_id}`)
            .setDescription(description)
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
            case "register":
                await register(message.member, message.channel, args[2])
                break
            case "unregister":
                await unregister(message.member, message.channel)
                break
            case "setmmr":
                await setMMR(message.member, message.channel, parseInt(args[2], 10))
                break
            case "mmr":
                await getMMR(message.member, message.channel)
                break
        }
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