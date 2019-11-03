import pgPromise from "pg-promise"

const dbUrl: string = process.env.DATABASE_URL ? process.env.DATABASE_URL + "?ssl=true" : ""

const pgp = pgPromise({})
const db = pgp(dbUrl)

export {db, pgp}