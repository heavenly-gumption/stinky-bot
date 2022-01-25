import firebaseAdmin from "firebase-admin"
import { getFirestoreConnection, find, all } from "../../../utils/db/firestore"
import {
    TEMP_ROLE_COLLECTION_NAME,
    TempRole,
    TempRoleDao,
} from "../temproles.dao"

function getKey(role: TempRole): string {
    return `${role.guild}-${role.user}-${role.roleName.replace(" ", "")}`
}

async function getAllTempRoles(): Promise<TempRole[]> {
    const db = getFirestoreConnection()
    const ref = db.collection(TEMP_ROLE_COLLECTION_NAME)
    return await all(ref)
}

async function addTempRole(tempRole: TempRole): Promise<null | void> {
    const ref = getFirestoreConnection()
        .collection(TEMP_ROLE_COLLECTION_NAME)
        .doc(getKey(tempRole))
    await ref.set(tempRole)
}

async function expireTempRoles(): Promise<TempRole[]> {
    const ref = getFirestoreConnection()
        .collection(TEMP_ROLE_COLLECTION_NAME)
    const now = new Date()
    const query = await ref.where("expiryTime", "<", now).get()
    query.docs.forEach(async doc => {
        await ref.doc(doc.id).delete()
    })

    return query.docs.map(doc => doc.data() as TempRole)
}

export const TempRoleFirestoreDao: TempRoleDao = {
    getAllTempRoles,
    addTempRole,
    expireTempRoles
}