import pgPromise from "pg-promise"
import { IDatabase, IMain } from "pg-promise"

let db: IDatabase<any>

export function getPgConnection(): IDatabase<any> {
    if (db !== undefined) {
        return db
    }
    const baseURL = process.env.DATABASE_URL ? process.env.DATABASE_URL: ""

    // See: https://help.heroku.com/MDM23G46/why-am-i-getting-an-error-when-i-upgrade-to-pg-8
    // Skip SSL verification
    const ssl = {
        rejectUnauthorized: false
    }

    const pgp: IMain = pgPromise({})
    db = pgp({
        connectionString: baseURL,
        ssl: ssl
    })

    console.log("Established Postgres database connection")
    return db
}