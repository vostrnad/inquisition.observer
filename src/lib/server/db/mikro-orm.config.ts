import { ReflectMetadataProvider, defineConfig } from '@mikro-orm/better-sqlite'
import { config } from '$lib/server/config'
import { Block } from './entities/block'
import { Transaction } from './entities/transaction'
import { TransactionInput } from './entities/transaction-input'

export default defineConfig({
  dbName: config.db.name,
  entities: [Block, Transaction, TransactionInput],
  metadataProvider: ReflectMetadataProvider,
  forceUtcTimezone: true,
})
