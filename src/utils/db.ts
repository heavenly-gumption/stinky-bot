import pgPromise from "pg-promise"

// Disable SSL if in development mode
function getDbString(): string {
    const baseURL = process.env.DATABASE_URL ? process.env.DATABASE_URL: ""
    if (process.env.NODE_ENV === "development") {
        return baseURL
    } else {
        return baseURL + "?ssl=true"
    }
}
const dbUrl: string = getDbString()

// Skip SSL verification if the environment is dev
const ssl = (process.env.NODE_ENV === "development") ? {rejectUnauthorized: false} : {rejectUnauthorized: true}

const pgp = pgPromise({})
const db = pgp({
    connectionString: dbUrl,
    ssl: ssl
})

export {db, pgp}