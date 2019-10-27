import {
    Client,
    User,
    Message
} from "discord.js"

import { BotModule } from "../types"
import {
    ActionQueue,
    ActionToPerform,
    updateActionQueue
} from "../util/action-queue"

// Module Types

type Status = "ready" | "interested" | "unready"
type Game = "dota2"
type GameUser = [Game, User]
type StatusTable = {
    [id: string]: {
        game: Game;
        status: Status;
        user: User;
    };
}
type StatusQueueTable = Record<Game, Record<Status, User[]>>

// State Management

const updateUser =
    (statusTable: StatusTable, statusQueueTable: StatusQueueTable) =>
    (action: ActionToPerform<Status, GameUser>) => {
        const [status, [game, user]] = action
        const oldStatusEntry = statusTable[user.id]
        if (oldStatusEntry) {
            statusQueueTable[oldStatusEntry.game][oldStatusEntry.status] = 
            statusQueueTable[oldStatusEntry.game][oldStatusEntry.status]
                .filter(queueUser => user.id !== queueUser.id)
        }

        statusTable[user.id] = {
            game,
            status,
            user
        }
        statusQueueTable[game][status] = [
            ...statusQueueTable[game][status],
            user
        ]
}
const removeUser =
    (statusTable: StatusTable, statusQueueTable: StatusQueueTable) =>
    (userToRemove: User) => {
        const { status, game, user } = statusTable[userToRemove.id]
        statusQueueTable[game][status] =
        statusQueueTable[game][status]
            .filter(queueUser => user.id !== queueUser.id)
        delete statusTable[user.id]
}

const userTable: StatusTable = {}
const actionQueue: ActionQueue<Status, GameUser> = []
const statusQueueTable: StatusQueueTable = {
    dota2: {
        ready: [],
        interested: [],
        unready: []
    }
}

const getStatusFromToken = (token: string): Status | null => {
    switch (token) {
        case "!ready":
            return "ready"
        case "!interested":
            return "interested"
        case "!unready":
            return "unready"
        default:
            return null
    }
}

const getGameFromToken = (token: string): Game | null => {
    switch (token) {
        case "dota2":
            return token
        default:
            return null
    }
}

const getActionFromMessage = (content: string, user: User): ActionToPerform<Status, [Game, User]> | null => {
    const STATUS_INDEX = 0
    const GAME_INDEX = 1
    const tokens = content.split(" ").map(token => token.toLowerCase())
    const status = getStatusFromToken(tokens[STATUS_INDEX])
    const game = getGameFromToken(tokens[GAME_INDEX])
    if (status && game) {
        return [status, [game, user]]
    } else {
        return null
    }
}

export const careAboutContent = (content: string): boolean => {
    return content.startsWith("!")
}

const log = (obj: Record<string, any>): string => {
    const SPACING = 4
    return JSON.stringify(obj, null, SPACING)
}

export const PlayStatusModule: BotModule = (client: Client) => {
    console.log("Loaded PlayStatusModule")
    client.on("message", message => {
        const { content, member } = message
        if (content && careAboutContent(content) && member) {
            if (content === "!remove") {
                console.log(`Removing ${member.user.username}`)
                const remove = removeUser(userTable, statusQueueTable)
                remove(member.user)
                console.log(`${member.user.username} removed successfully!`)
            } else {
                const action = getActionFromMessage(content, member.user)
                if (action) {
                    const [status, [game, user] ] = action
                    console.log(`Updating ${user.username} to ${status} for ${game}`)
                    const update = updateUser(userTable, statusQueueTable)
                    update(action)
                    console.log(`${member.user.username} updated successfully!`)
                }
            }
            console.log({sqt: log(statusQueueTable)})
            console.log({ut: log(userTable)})
        }
    })
}