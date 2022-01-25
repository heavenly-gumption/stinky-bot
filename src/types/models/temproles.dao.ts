export type TempRole = {
    guild: string
    user: string
    roleName: string
    expiryTime: Date
}

export const TEMP_ROLE_COLLECTION_NAME = 'temproles'

export type TempRoleDao = {
    getAllTempRoles: () => Promise<TempRole[]>
    addTempRole: (tempRole: TempRole) => Promise<null | void>
    expireTempRoles: () => Promise<TempRole[]>
}