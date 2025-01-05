import { MikroORM } from '@mikro-orm/better-sqlite'
import config from './mikro-orm.config'

let database: MikroORM | undefined
let databasePromise: Promise<MikroORM> | undefined

export const getDatabase = async (): Promise<MikroORM> => {
  if (databasePromise) return databasePromise

  if (!database) {
    databasePromise = (async () => {
      const db = await MikroORM.init(config)
      await db.schema.updateSchema()
      return db
    })()
    database = await databasePromise
    databasePromise = undefined
  }

  return database
}

export const initDatabase = async (): Promise<void> => {
  await getDatabase()
}

export const closeDatabaseIfConnected = async (): Promise<void> => {
  const db = await (databasePromise ?? database)
  database = undefined
  await db?.close()
}
