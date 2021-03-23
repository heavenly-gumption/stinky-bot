import { ClipDao } from "../types/models/clip.dao"
import { MoneyBalanceDao } from "../types/models/moneybalance.dao"
import { ReminderDao } from "../types/models/reminder.dao"
import { VibeHistoryDao } from "../types/models/vibehistory.dao"

import { ClipPgDao } from "../types/models/pg/clip"
import { MoneyBalancePgDao } from "../types/models/pg/moneybalance"
import { ReminderPgDao } from "../types/models/pg/reminder"
import { VibeHistoryPgDao } from "../types/models/pg/vibehistory"

import { ClipFirestoreDao } from "../types/models/firestore/clip"
import { MoneyBalanceFirestoreDao } from "../types/models/firestore/moneybalance"
import { ReminderFirestoreDao } from "../types/models/firestore/reminder"
import { VibeHistoryFirestoreDao } from "../types/models/firestore/vibehistory"
import { SharesFirestoreDao } from "../types/models/firestore/shares"

const isPg = process.env.DATABASE_TYPE === "pg"

export function getClipDao() {
    return isPg ? ClipPgDao : ClipFirestoreDao
}

export function getMoneyBalanceDao() {
    return isPg ? MoneyBalancePgDao : MoneyBalanceFirestoreDao
}

export function getReminderDao() {
    return isPg ? ReminderPgDao : ReminderFirestoreDao
}

export function getVibeHistoryDao() {
    return isPg ? VibeHistoryPgDao : VibeHistoryFirestoreDao
}

export function getSharesDao() {
    if (isPg) {
        throw "Shares are not supported for Postgres"
    }
    return SharesFirestoreDao
}