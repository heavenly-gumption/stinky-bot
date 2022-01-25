import { Client } from "discord.js"
import { CronJob } from "cron"

import { TempRole } from "../types/models/temproles.dao"
import { getTempRoleDao } from "./model"

export type TempRoleManager = {
  addTempRole: (client: Client, tempRole: TempRole) => Promise<void>;
}

async function removeTempRole(client: Client, tempRole: TempRole) {
  const guild = client.guilds.cache.get(tempRole.guild)
  if (!guild) return

  const member = guild.members.cache.get(tempRole.user)
  if (!member) return

  const role = guild.roles.cache.find(r => r.name === tempRole.roleName)
  if (!role) return

  await member.roles.remove(role)
}

async function addTempRole(client: Client, tempRole: TempRole) {
  const guild = client.guilds.cache.get(tempRole.guild)
  if (!guild) return

  const member = guild.members.cache.get(tempRole.user)
  if (!member) return

  const role = guild.roles.cache.find(r => r.name === tempRole.roleName)
  if (!role) return

  await member.roles.add(role)
  await getTempRoleDao().addTempRole(tempRole)
}


let cronJob: CronJob | null = null
export function getTempRoleManager(client: Client): TempRoleManager {
  if (!cronJob) {
    cronJob = new CronJob("30 * * * * *", async () => {
        const expiredTempRoles = await getTempRoleDao().expireTempRoles()
        expiredTempRoles.forEach(tempRole => removeTempRole(client, tempRole))
    })
    cronJob.start()
  }

  return {
    addTempRole
  }
}