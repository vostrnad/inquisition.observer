import { EntityRepository } from '@mikro-orm/core'
import { Block } from '$lib/server/db/entities/block'
import { hexToBuffer } from '$lib/server/utils/buffer'

export class BlockRepository extends EntityRepository<Block> {
  public async findByHash(hash: Buffer | string): Promise<Block | null> {
    if (typeof hash === 'string') {
      hash = hexToBuffer(hash)
    }
    return this.findOne({ hash })
  }

  public async findByHeight(height: number): Promise<Block | null> {
    return this.findOne({ height })
  }

  public async findBestBlock(): Promise<Block | null> {
    return (
      (await this.find({}, { orderBy: { height: 'desc' }, limit: 1 })).at(0) ||
      null
    )
  }

  public async deleteAboveHeight(height: number): Promise<number> {
    return this.nativeDelete({ height: { $gt: height } })
  }
}
