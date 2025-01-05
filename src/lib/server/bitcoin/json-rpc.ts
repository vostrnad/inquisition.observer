import PQueue from 'p-queue'
import { sleep } from '$lib/utils/async'

interface RpcResponse {
  result: unknown
  error: { code: number; message: string } | null
}

interface RpcRequest {
  jsonrpc: string
  method: string
  params: unknown[]
}

export type ScriptPubKeyType =
  | 'nonstandard'
  | 'pubkey'
  | 'pubkeyhash'
  | 'scripthash'
  | 'multisig'
  | 'nulldata'
  | 'witness_v0_scripthash'
  | 'witness_v0_keyhash'
  | 'witness_v1_taproot'
  | 'anchor'
  | 'witness_unknown'

export interface CoinbaseInput {
  coinbase: string
  txinwitness?: string[]
  sequence: number
}

export interface NoncoinbaseInput {
  txid: string
  vout: number
  scriptSig: {
    hex: string
  }
  prevout?: {
    value: number
    scriptPubKey: {
      hex: string
      address?: string
      type: ScriptPubKeyType
    }
  }
  txinwitness?: string[]
  sequence: number
}

export type TxInput = CoinbaseInput | NoncoinbaseInput

export interface TxOutput {
  value: number
  scriptPubKey: {
    hex: string
    address?: string
    type: ScriptPubKeyType
  }
}

export interface Transaction {
  txid: string
  hash: string
  version: number
  size: number
  vsize: number
  weight: number
  locktime: number
  vin: TxInput[]
  vout: TxOutput[]
  fee: number
}

export interface BlockHeader {
  hash: string
  confirmations: number
  height: number
  time: number
  mediantime: number
  nTx: number
  previousblockhash?: string
  nextblockhash?: string
}

export interface Block extends BlockHeader {
  tx: Transaction[]
}

export interface ChainInfo {
  blocks: number
  bestblockhash: string
}

export interface BitcoinJsonRpcClientOptions {
  host: string
  auth: string
}

export class BitcoinJsonRpcClient {
  private readonly queue = new PQueue({ concurrency: 16 })
  private readonly getBlockQueue = new PQueue({ concurrency: 8 })

  private readonly host: string
  private readonly rpcHeaders: HeadersInit

  constructor(options: BitcoinJsonRpcClientOptions) {
    this.host = options.host
    this.rpcHeaders = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'text/plain',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Authorization: `Basic ${Buffer.from(options.auth).toString('base64')}`,
    }
  }

  public async getBlock(hash: string): Promise<Block> {
    return this.getBlockQueue.add(
      async () => this.sendCommand('getblock', [hash, 3]),
      { throwOnTimeout: true },
    )
  }

  public async getBlockHash(height: number): Promise<string> {
    return this.sendCommand('getblockhash', [height])
  }

  public async getBlockByHeight(height: number): Promise<Block> {
    const hash = await this.getBlockHash(height)
    return this.getBlock(hash)
  }

  public async getBlocksByHeights(heights: number[]): Promise<Block[]> {
    const hashes = await this.sendCommandBatch<string[]>(
      heights.map((height) => ({ method: 'getblockhash', params: [height] })),
    )
    const blocks = await this.getBlockQueue.add(
      async () =>
        this.sendCommandBatch<Block[]>(
          hashes.map((hash) => ({ method: 'getblock', params: [hash, 3] })),
        ),
      { throwOnTimeout: true },
    )
    return blocks
  }

  public async getBlockRange(
    startHeight: number,
    endHeight: number,
    fn: (blocks: Block[]) => Promise<void>,
  ): Promise<void> {
    let batchHeights: number[] = []
    for (let height = startHeight; height <= endHeight; height++) {
      batchHeights.push(height)

      if (batchHeights.length >= 32 || height === endHeight) {
        // eslint-disable-next-line no-await-in-loop
        await fn(await this.getBlocksByHeights(batchHeights))
        batchHeights = []
      }
    }
  }

  public async getBlockHeader(hash: string): Promise<BlockHeader> {
    return this.sendCommand('getblockheader', [hash])
  }

  public async getBlockHeaderByHeight(height: number): Promise<BlockHeader> {
    const hash = await this.getBlockHash(height)
    return this.sendCommand('getblockheader', [hash])
  }

  public async getBlockchainInfo(): Promise<ChainInfo> {
    return this.sendCommand('getblockchaininfo', [])
  }

  public async waitForRpcServerStart(): Promise<void> {
    for (let i = 0; i < 60; i++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.getBlockchainInfo()
        return
      } catch {
        // eslint-disable-next-line no-await-in-loop
        await sleep(1000)
        continue
      }
    }
    throw new Error('Server not available')
  }

  private async sendToRpc(body: RpcRequest): Promise<RpcResponse>
  private async sendToRpc(body: RpcRequest[]): Promise<RpcResponse[]>
  private async sendToRpc(body: RpcRequest | RpcRequest[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await fetch(this.host, {
      method: 'POST',
      headers: this.rpcHeaders,
      body: JSON.stringify(body),
    }).then(async (res) => {
      if (res.status >= 400) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return json
    })
  }

  private async sendCommand<T>(method: string, params: unknown[]): Promise<T> {
    const promise = this.queue.add(async () =>
      this.sendToRpc({
        jsonrpc: '1.0',
        method,
        params,
      })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error('JSON-RPC error on command:', method, params)
          throw e
        })
        .then((json) => {
          if (json.error) {
            throw new Error(json.error.message)
          }
          return json.result
        }),
    ) as Promise<T>
    return promise
  }

  private async sendCommandBatch<T>(
    batch: Array<{ method: string; params: unknown[] }>,
  ): Promise<T> {
    return this.queue.add(async () =>
      this.sendToRpc(
        batch.map(({ method, params }) => ({
          jsonrpc: '1.0',
          method,
          params,
        })),
      ).then((json) => {
        return json.map((item) => {
          if (item.error) {
            throw new Error(item.error.message)
          }
          return item.result
        })
      }),
    ) as Promise<T>
  }
}
