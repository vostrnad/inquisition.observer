/* eslint-disable no-console */
import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import zmq from 'zeromq/v5-compat'
import { bufferToHex } from '$lib/server/utils/buffer'
import { type TypedEventEmitter } from '$lib/server/utils/typed-event-emitter'
import { BitcoinJsonRpcClient, type Block } from './json-rpc'

export type {
  Block,
  BlockHeader,
  Transaction,
  TxInput,
  TxOutput,
  ScriptPubKeyType,
} from './json-rpc'

export interface ChainTip {
  hash: string
  height: number
}

export type EventMap = {
  connect: undefined
  disconnect: undefined
  syncstart: number
  syncblock: ChainTip
  syncend: ChainTip
  chaintipupdate: ChainTip
  newblock: ChainTip & {
    timestamp: number
    received: Date
  }
  rollback: ChainTip
  error: unknown
}

export interface BitcoinChainClientOptions {
  host: string
  auth: string
  zmqpubhashblock: string
}

export abstract class BitcoinChainClient extends (EventEmitter as new () => TypedEventEmitter<EventMap>) {
  private readonly rpc: BitcoinJsonRpcClient
  private socket?: zmq.Socket

  private readonly chainQueue = new PQueue({ concurrency: 1 })
  private readonly socketQueue = new PQueue({ concurrency: 1 })

  private readonly zmqpubhashblock: string

  constructor(options: BitcoinChainClientOptions) {
    super()
    this.rpc = new BitcoinJsonRpcClient({
      host: options.host,
      auth: options.auth,
    })
    this.zmqpubhashblock = options.zmqpubhashblock
  }

  public start(): void {
    if (this.socket) {
      this.socket.close()
    }

    this.socket = zmq.socket('sub')

    this.socket.on('connect', () => {
      this.emit('connect')
      this.socketQueue
        .add(async () => {
          await this.rpc.waitForRpcServerStart()
          await this.syncToChainTip()
        })
        .catch((e) => this.emit('error', e))
    })

    this.socket.on('message', (topic: Buffer, message: Buffer) => {
      const now = new Date()
      this.socketQueue
        .add(async () => {
          const topicStr = topic.toString('utf8')
          if (topicStr === 'hashblock') {
            const block = await this.rpc.getBlock(bufferToHex(message))
            this.emit('newblock', {
              hash: block.hash,
              height: block.height,
              timestamp: block.time,
              received: now,
            })
            await this.advanceChain(block)
          }
        })
        .catch((e) => this.emit('error', e))
    })

    this.socket.on('disconnect', () => {
      this.emit('disconnect')
    })

    this.socket.on('error', (e) => {
      this.emit('error', e)
    })

    this.socket.connect(this.zmqpubhashblock)
    this.socket.subscribe('hashblock')
    this.socket.monitor()
  }

  public stop(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = undefined
    }
  }

  public async getChainTip(): Promise<ChainTip> {
    const defaultBlockHeight = 0

    let height: number
    let hash: string

    const bestBlock = await this.getStoredChainTip()

    if (bestBlock) {
      height = bestBlock.height
      hash = bestBlock.hash
    } else {
      height = defaultBlockHeight
      const block = await this.rpc.getBlockByHeight(height)
      hash = block.hash

      await this.processBlocks([block])
      this.emit('chaintipupdate', { hash, height })
    }

    return { hash, height }
  }

  public async syncToChainTip(): Promise<void> {
    const currentChainTip = await this.rpc.getBlockchainInfo()

    await this.advanceChain({
      height: currentChainTip.blocks,
      hash: currentChainTip.bestblockhash,
    })
  }

  private async advanceChain(newChainTip: ChainTip | Block): Promise<void> {
    let block = 'tx' in newChainTip ? newChainTip : undefined

    const targetBlockHash = newChainTip.hash
    const targetBlockHeight = newChainTip.height

    return this.chainQueue.add(async () => {
      const dbChainTip = await this.getChainTip()

      // Check if current best block same as requested block
      if (dbChainTip.hash === targetBlockHash) {
        console.log('already synced at block', targetBlockHeight)
        return
      }

      // Check if requested block already in database
      if (dbChainTip.height > targetBlockHeight) {
        const existingBlock = await this.getStoredBlockByHash(targetBlockHash)
        if (existingBlock) {
          console.warn('block already in database')
          return
        }
      }

      const closestCommonPoint = await this.findClosestCommonBlock(dbChainTip, {
        height: targetBlockHeight,
        hash: targetBlockHash,
      })

      let dbHeight = dbChainTip.height

      // Rollback chain if DB chain tip is outdated
      if (closestCommonPoint.hash !== dbChainTip.hash) {
        await this.rollbackStoredChain(closestCommonPoint)
        this.emit('rollback', closestCommonPoint)
        dbHeight = closestCommonPoint.height
      }

      // If block is one ahead add it directly. If there are more blocks to
      // add, fetch them from JSON-RPC.
      if (targetBlockHeight === dbHeight + 1) {
        if (!block) block = await this.rpc.getBlock(targetBlockHash)
        await this.processBlocks([block])
        this.emit('chaintipupdate', { hash: block.hash, height: block.height })
      } else {
        const numberOfBlocks = targetBlockHeight - dbHeight
        this.emit('syncstart', numberOfBlocks)

        await this.rpc.getBlockRange(
          dbHeight + 1,
          targetBlockHeight,
          async (rpcBlocks) => {
            await this.processBlocks(rpcBlocks)
            for (const rpcBlock of rpcBlocks) {
              this.emit('chaintipupdate', {
                hash: rpcBlock.hash,
                height: rpcBlock.height,
              })
              this.emit('syncblock', {
                hash: rpcBlock.hash,
                height: rpcBlock.height,
              })
            }
          },
        )

        this.emit('syncend', {
          hash: targetBlockHash,
          height: targetBlockHeight,
        })
      }
    })
  }

  private async findClosestCommonBlock(
    dbChainTip: ChainTip,
    nodeChainTip: ChainTip,
  ): Promise<ChainTip> {
    let height: number
    let nodeBlockHash: string

    if (nodeChainTip.height >= dbChainTip.height) {
      // node is ahead, check if db is the closest point
      height = dbChainTip.height
      const header = await this.rpc.getBlockHeaderByHeight(height)
      if (dbChainTip.hash === header.hash) {
        return dbChainTip
      } else {
        height--
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        nodeBlockHash = header.previousblockhash!
      }
    } else {
      // db is ahead
      height = nodeChainTip.height
      nodeBlockHash = nodeChainTip.hash
    }

    while (height >= 0) {
      // eslint-disable-next-line no-await-in-loop
      const dbBlock = await this.getStoredBlockByHeight(height)

      if (!dbBlock) {
        throw new Error('block not in database')
      }

      const dbBlockHash = dbBlock.hash

      if (dbBlock.hash === nodeBlockHash) {
        return {
          height,
          hash: nodeBlockHash,
        }
      }

      if (height === 0) {
        console.log(dbBlockHash, nodeBlockHash)
        throw new Error('genesis block differs from node')
      }

      // Search one block behind
      // eslint-disable-next-line no-await-in-loop
      const nodeBlockHeader = await this.rpc.getBlockHeader(nodeBlockHash)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nodeBlockHash = nodeBlockHeader.previousblockhash!
      height--
    }

    throw new Error('could not find a common block hash')
  }

  protected abstract processBlocks(blocks: Block[]): Promise<void>

  protected abstract getStoredBlockByHeight(
    height: number,
  ): Promise<ChainTip | null | undefined>

  protected abstract getStoredBlockByHash(
    hash: string,
  ): Promise<ChainTip | null | undefined>

  protected abstract getStoredChainTip(): Promise<ChainTip | null | undefined>

  protected abstract rollbackStoredChain(chainTip: ChainTip): Promise<void>
}
