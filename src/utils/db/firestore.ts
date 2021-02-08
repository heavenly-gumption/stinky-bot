import firebaseAdmin from "firebase-admin"

function getCredentials(): firebaseAdmin.ServiceAccount {
    const privateKeyBase64: string | undefined = process.env.FIREBASE_PRIVATE_KEY_BASE_64
    if (!privateKeyBase64) {
        throw "Env variable FIREBASE_PRIVATE_KEY_BASE_64 is not defined"
    }

    const privateKey = Buffer.from(privateKeyBase64, "base64")
        .toString("utf-8")
        .replace(/\\n/g, "\n")

    console.log(privateKey)
    return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKeyBase64.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }
}

let db: FirebaseFirestore.Firestore

export function getFirestoreConnection(): FirebaseFirestore.Firestore {
    if (db !== undefined) {
        return db
    }

    const credentials = getCredentials()
    const firebaseAdminApp = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(credentials),
        databaseURL: process.env.FIRESTORE_URL
    })

    db = firebaseAdminApp.firestore()

    console.log("Established Firestore connection")
    return db
}

// DB query helper functions

// Get a single document by its id. Resolve the item. Reject if the item does not exist in the collection.
export function getOne<T>(ref: FirebaseFirestore.CollectionReference, id: string): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
        const doc = await ref.doc(id).get()
        if (!doc.exists) {
            reject(`Item ${id} not found in collection ${ref.id}`)
        } else {
            resolve(doc.data() as T)
        }
    })
}

// Find a single document by query. Resolve the item. Reject if the item does not exist in the collection.
export function findOne<T>(
    ref: FirebaseFirestore.CollectionReference, 
    fieldPath: string, 
    opStr: FirebaseFirestore.WhereFilterOp, 
    value: any): Promise<T> 
{
    return new Promise(async (resolve, reject) => {
        const snapshot = await ref.where(fieldPath, opStr, value).get()
        if (snapshot.empty) {
            reject("Item not found")
        } else {
            resolve(snapshot.docs[0].data() as T)
        }
    })
}

// Find multiple documents by query. Resolve items.
export function find<T>(
    ref: FirebaseFirestore.CollectionReference, 
    fieldPath: string, 
    opStr: FirebaseFirestore.WhereFilterOp, 
    value: any): Promise<Array<T>> 
{
    return new Promise(async (resolve, reject) => {
        const snapshot = await ref.where(fieldPath, opStr, value).get()
        resolve(snapshot.docs.map(doc => doc.data() as T))
    })
}

// Get all documents in a collection. Resolve the array.
export function all<T>(ref: FirebaseFirestore.CollectionReference): Promise<Array<T>> {
    return new Promise<Array<T>>(async (resolve, reject) => {
        const snapshot = await ref.get()
        resolve(snapshot.docs.map(doc => doc.data() as T))
    })
}

// Sets document data by id
export function set<T>(ref: FirebaseFirestore.CollectionReference, id: string, value: T): Promise<null> {
    return new Promise<null>(async (resolve, reject) => {
        await ref.doc(id).set(value)
        resolve()
    })
}

// Removes a document by id
export function remove(ref: FirebaseFirestore.CollectionReference, id: string): Promise<null> {
    return new Promise<null>(async (resolve, reject) => {
        await ref.doc(id).delete()
        resolve()
    })
}

// Updates document data by id
export function update(ref: FirebaseFirestore.CollectionReference, id: string, fields: any): Promise<null> {
    return new Promise<null>(async (resolve, reject) => {
        await ref.doc(id).update(fields)
        resolve()
    })
}