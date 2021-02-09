import { getFirestoreConnection } from "../utils/db/firestore"
import { getPgConnection } from "../utils/db/pg"

import * as dotenv from "dotenv"

dotenv.config()


async function main() {
    const pg = getPgConnection()
    const fs = getFirestoreConnection()

    // Chats
    const chats = await pg.many("SELECT * FROM Chats")
    chats.forEach(async chat => {
        await fs.collection("chats").doc(chat.id.toString()).set(chat)
    })
    console.log("Migrated Chats.")

    // Clips
    const clips = await pg.many("SELECT * FROM Clips")
    clips.forEach(async clip => {
        await fs.collection("clips").doc(clip.id).set(clip)
    })
    console.log("Migrated Clips.")

    // Money
    const moneys = await pg.many("SELECT * FROM MoneyBalance")
    moneys.forEach(async money => {
        await fs.collection("moneybalance").doc(money.id).set(money)
    })
    console.log("Migrated Money.")

    // Reminders
    const reminders = await pg.many("SELECT * FROM Reminders")
    reminders.forEach(async reminder => {
        await fs.collection("reminders").doc(reminder.id).set(reminder)
    })
    console.log("Migrated Reminders.")

    // Vibes
    const vibes = await pg.many("SELECT * FROM VibeHistory")
    vibes.forEach(async vibe => {
        await fs.collection("vibehistory").doc(vibe.id + ":" + vibe.time.getTime()).set(vibe)
    })
    console.log("Migrated VibeHistory.")
}

main()