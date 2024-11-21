import {
  Entity,
  EntityRepositoryType,
  Index,
  Property,
  Unique,
} from '@mikro-orm/core'
import { BlockRepository } from '$lib/server/db/repositories/block'
import { CustomBaseEntity } from './base'

@Entity({ repository: () => BlockRepository })
export class Block extends CustomBaseEntity {
  [EntityRepositoryType]?: BlockRepository

  @Property({ type: 'blob' })
  @Unique()
  @Index()
  public hash: Buffer

  @Property({ type: 'integer' })
  @Unique()
  @Index()
  public height: number

  @Property({ type: 'integer' })
  public time: number
}
