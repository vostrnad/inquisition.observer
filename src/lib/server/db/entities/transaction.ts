import {
  Collection,
  Entity,
  EntityRepositoryType,
  Index,
  ManyToOne,
  OneToMany,
  Property,
  Unique,
} from '@mikro-orm/core'
import { TransactionRepository } from '$lib/server/db/repositories/transaction'
import { CustomBaseEntity } from './base'
import { Block } from './block'
import { TransactionInput } from './transaction-input'

@Entity({ repository: () => TransactionRepository })
@Unique({ properties: ['block', 'blockPosition'] })
export class Transaction extends CustomBaseEntity {
  [EntityRepositoryType]?: TransactionRepository

  @Property({ type: 'blob' })
  @Unique()
  public txid: Buffer
  @Property({ type: 'integer' })
  public vsize: number
  @Property({ type: 'integer' })
  public blockPosition: number

  @Property({ type: 'boolean' })
  @Index()
  public hasApo: boolean
  @Property({ type: 'boolean' })
  @Index()
  public hasCtv: boolean
  @Property({ type: 'boolean' })
  @Index()
  public hasCat: boolean

  @ManyToOne(() => Block, { deleteRule: 'cascade' })
  public block: Block

  @OneToMany(() => TransactionInput, 'transaction', {
    orderBy: { inputIndex: 'asc' },
  })
  public inputs = new Collection<TransactionInput>(this)
}
