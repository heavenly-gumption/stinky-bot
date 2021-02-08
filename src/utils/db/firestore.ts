import firebaseAdmin from "firebase-admin"

function getCredentials(): firebaseAdmin.ServiceAccount {
    const privateKeyBase64: string | undefined = process.env.FIREBASE_PRIVATE_KEY_BASE_64
    if (!privateKeyBase64) {
        throw "Env variable FIREBASE_PRIVATE_KEY_BASE_64 is not defined"
    }

    const privateKey = Buffer.from(privateKeyBase64, "base64")
        .toString("utf-8")
        .replace(/\\n/g, "\n")

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
export async function getOne<T>(ref: FirebaseFirestore.CollectionReference, id: string): Promise<T> {
    const doc = await ref.doc(id).get()
    if (!doc.exists) {
        console.log("asldkfj")
        throw `Item ${id} not found in collection ${ref.id}`
    } else {
        return doc.data() as T
    }
}

// Find a single document by query. Resolve the item. Reject if the item does not exist in the collection.
export async function findOne<T>(
    ref: FirebaseFirestore.CollectionReference, 
    fieldPath: string, 
    opStr: FirebaseFirestore.WhereFilterOp, 
    value: any): Promise<T> 
{
    const snapshot = await ref.where(fieldPath, opStr, value).get()
    if (snapshot.empty) {
        throw "Item not found"
    } else {
        return snapshot.docs[0].data() as T
    }
}

// Find multiple documents by query. Resolve items.
export async function find<T>(
    ref: FirebaseFirestore.CollectionReference, 
    fieldPath: string, 
    opStr: FirebaseFirestore.WhereFilterOp, 
    value: any): Promise<Array<T>> 
{
    const snapshot = await ref.where(fieldPath, opStr, value).get()
    return snapshot.docs.map(doc => doc.data() as T)
}

// Get all documents in a collection. Resolve the array.
export async function all<T>(ref: FirebaseFirestore.CollectionReference): Promise<Array<T>> {
    const snapshot = await ref.get()
    return snapshot.docs.map(doc => doc.data() as T)
}