import pgPromise from "pg-promise"

const baseURL = process.env.DATABASE_URL ? process.env.DATABASE_URL: ""

// See: https://help.heroku.com/MDM23G46/why-am-i-getting-an-error-when-i-upgrade-to-pg-8
// Skip SSL verification
const ssl = {
    rejectUnauthorized: false
}

const pgp = pgPromise({})
const db = pgp({
    connectionString: baseURL,
    ssl: ssl
})

export {db, pgp}