export * from './module'

export type Environment = {
    DATABASE_TYPE: string,
    DATABASE_URL: string,
    FIREBASE_PRIVATE_KEY_BASE_64: string,
    FIREBASE_PROJECT_ID: string,
    FIREBASE_CLIENT_EMAIL: string,
    FIRESTORE_URL: string,
    DISCORD_TOKEN: string,
    AWS_ACCESS_KEY_ID: string,
    AWS_SECRET: string,
}