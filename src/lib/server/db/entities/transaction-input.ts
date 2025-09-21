import { Entity, Enum, ManyToOne, Property, Unique } from '@mikro-orm/core'
import { decodeScript } from '$lib/server/bitcoin/script'
import { CustomBaseEntity } from './base'
import { Transaction } from './transaction'

export enum InputType {
  bare = 'bare',
  p2sh = 'p2sh',
  p2shP2wsh = 'p2sh-p2wsh',
  p2wsh = 'p2wsh',
  p2tr = 'p2tr',
}

@Entity()
@Unique({ properties: ['transaction', 'inputIndex'] })
export class TransactionInput extends CustomBaseEntity {
  @Property({ type: 'integer' })
  public inputIndex: number
  @Property({ type: 'string', nullable: true })
  public address?: string
  @Enum(() => InputType)
  public type: InputType
  @Property({ type: 'blob', hidden: true })
  public script: Buffer
  @Property({ type: 'boolean' })
  public hasApo: boolean
  @Property({ type: 'boolean' })
  public hasCtv: boolean
  @Property({ type: 'boolean' })
  public hasCat: boolean
  @Property({ type: 'boolean' })
  public hasCsfs: boolean
  @Property({ type: 'boolean' })
  public hasIkey: boolean

  @Property({ type: 'string', persist: false })
  public get scriptAsm(): string {
    return decodeScript(this.script)
  }

  @ManyToOne(() => Transaction, { deleteRule: 'cascade', hidden: true })
  public transaction: Transaction
}
