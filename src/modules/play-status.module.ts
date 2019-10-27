import { Client, User } from "discord.js"

import { BotModule } from "../types"
import {
    ActionQueue,
    ActionToPerform,
    updateActionQueue
} from "../util/action-queue"

type Status = "ready" | "interested" | "unready"
type Game = "dota2"
type GameUser = [Game, User]
type StatusTable = {
    [id: string]: {
        game: Game,
        status: Status,
        user: User
    }
}
type StatusQueueTable = Record<Game, Record<Status, User[]>>

const userTable: StatusTable = {}
const actionQueue: ActionQueue<Status, GameUser> = []
const statusQueueTable: StatusQueueTable = {
    dota2: {
        ready: [],
        interested: [],
        unready: []
    }
}

const updateUser =
    (statusTable: StatusTable, statusQueueTable: StatusQueueTable) =>
    (action: ActionToPerform<Status, GameUser>) => {
        const [status, [game, user]] = action
        const oldStatusEntry = statusTable[user.id]
        if (oldStatusEntry) {
            statusQueueTable[oldStatusEntry.game][oldStatusEntry.status] = 
            statusQueueTable[oldStatusEntry.game][oldStatusEntry.status]
                .filter(queueUser => user.id === queueUser.id)
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
            .filter(queueUser => user.id === queueUser.id)
        delete statusTable[user.id]
}