import { wrap } from '@mikro-orm/core'
import { config } from '$lib/server/config'
import { getDatabase } from '$lib/server/db'
import { Block } from '$lib/server/db/entities/block'
import { bufferToHex, hexToBuffer } from '$lib/server/utils/buffer'
import {
  BitcoinChainClient,
  type ChainTip,
  type Block as RpcBlock,
} from './bitcoin-chain-client'
import { getTransactionEntity } from './processing'

export class ChainState extends BitcoinChainClient {
  constructor() {
    super({
      host: config.bitcoin.rpcHost,
      auth: config.bitcoin.rpcAuth,
      zmqpubhashblock: config.bitcoin.zmqpubhashblock,
    })
  }

  protected async processBlocks(blocks: RpcBlock[]): Promise<void> {
    const db = await getDatabase()
    const em = db.em.fork()

    for (const block of blocks) {
      const dbBlock = wrap(new Block()).assign({
        height: block.height,
        hash: hexToBuffer(block.hash),
        time: block.time,
      })

      em.persist(dbBlock)

      for (let i = 0; i < block.tx.length; i++) {
        const tx = block.tx[i]
        const transactionEntity = getTransactionEntity(tx, block.height, i)

        if (transactionEntity) {
          transactionEntity.block = dbBlock
          em.persist(transactionEntity)
        }
      }
    }

    await em.flush()
  }

  protected async getStoredBlockByHeight(
    height: number,
  ): Promise<ChainTip | undefined> {
    const db = await getDatabase()
    const block = await db.em.fork().getRepository(Block).findByHeight(height)
    if (!block) return
    return this.dbBlockToChainTip(block)
  }

  protected async getStoredBlockByHash(
    hash: string,
  ): Promise<ChainTip | undefined> {
    const db = await getDatabase()
    const block = await db.em.fork().getRepository(Block).findByHash(hash)
    if (!block) return
    return this.dbBlockToChainTip(block)
  }

  protected async getStoredChainTip(): Promise<ChainTip | undefined> {
    const db = await getDatabase()
    const bestBlock = await db.em.fork().getRepository(Block).findBestBlock()
    if (!bestBlock) return
    return this.dbBlockToChainTip(bestBlock)
  }

  protected async rollbackStoredChain(chainTip: ChainTip): Promise<void> {
    const db = await getDatabase()
    await db.em.fork().getRepository(Block).deleteAboveHeight(chainTip.height)
  }

  private dbBlockToChainTip(block: Block): ChainTip {
    return {
      hash: bufferToHex(block.hash),
      height: block.height,
    }
  }
}
