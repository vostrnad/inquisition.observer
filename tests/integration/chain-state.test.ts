import { wrap } from '@mikro-orm/core'
import { describe, expect, it } from 'vitest'
import type { ChainTip } from '$lib/server/bitcoin/bitcoin-chain-client'
import { ChainState } from '$lib/server/bitcoin/chain-state'
import type { Block as RpcBlock } from '$lib/server/bitcoin/json-rpc'
import { getDatabase } from '$lib/server/db'
import { Block } from '$lib/server/db/entities/block'
import { Transaction } from '$lib/server/db/entities/transaction'
import { hexToBuffer } from '$lib/server/utils/buffer'
import { createArray } from '$lib/utils/array'
import {
  createBareInput,
  createBlock,
  createP2SHInput,
  createP2TRInput,
  createP2WSHInput,
  createTransaction,
  createWrappedP2SHInput,
} from '$tests/utils/bitcoin'

const getAllTransactions = async () => {
  const db = await getDatabase()
  const em = db.em.fork()
  const transactionRepository = em.getRepository(Transaction)
  return transactionRepository.findAll({ populate: ['*'] })
}

const getAllBlocks = async () => {
  const db = await getDatabase()
  const em = db.em.fork()
  const blockRepository = em.getRepository(Block)
  return blockRepository.findAll()
}

const insertBlocks = async (count: number) => {
  const db = await getDatabase()
  const em = db.em.fork()
  await em.persistAndFlush(
    createArray(count, () => createBlock([])).map((block, i) =>
      wrap(new Block()).assign({
        height: i,
        hash: hexToBuffer(block.hash),
        time: block.time,
      }),
    ),
  )
}

describe('ChainState', () => {
  describe('processBlocks', () => {
    const processBlocks = async (blocks: RpcBlock[]) => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      await new ChainState()['processBlocks'](blocks)
    }

    it('should process an empty array of blocks', async () => {
      await processBlocks([])

      const blocks = await getAllBlocks()
      expect(blocks).toHaveLength(0)

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(0)
    })

    it('should process an empty block', async () => {
      await processBlocks([createBlock([])])

      const blocks = await getAllBlocks()
      expect(blocks).toHaveLength(1)
      expect(blocks).toMatchSnapshot()

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(0)
    })

    it('should process blocks with CTV', async () => {
      await processBlocks([
        createBlock([
          createTransaction([createBareInput('b3')]),
          createTransaction([createP2SHInput('b3')]),
        ]),
        createBlock([
          createTransaction([createWrappedP2SHInput('b3')]),
          createTransaction([createP2WSHInput('b3')]),
          createTransaction([createP2TRInput('b3')]),
        ]),
      ])

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(5)
      expect(transactions).toMatchSnapshot()
    })

    it('should process blocks with APO', async () => {
      await processBlocks([
        createBlock([
          createTransaction([createP2TRInput('51ac')]),
          createTransaction([
            createP2TRInput(
              '21010000000000000000000000000000000000000000000000000000000000000000ac',
            ),
          ]),
        ]),
        createBlock([
          createTransaction([createP2TRInput('51ad')]),
          createTransaction([
            createP2TRInput(
              '21010000000000000000000000000000000000000000000000000000000000000000ad',
            ),
          ]),
        ]),
        createBlock([
          createTransaction([createP2TRInput('51ba')]),
          createTransaction([
            createP2TRInput(
              '21010000000000000000000000000000000000000000000000000000000000000000ba',
            ),
          ]),
        ]),
      ])

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(6)
      expect(transactions).toMatchSnapshot()
    })

    it('should process a block with CAT', async () => {
      await processBlocks([
        createBlock([createTransaction([createP2TRInput('7e')])]),
      ])

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(1)
      expect(transactions).toMatchSnapshot()
    })

    it('should process a block with CSFS', async () => {
      await processBlocks([
        createBlock([createTransaction([createP2TRInput('cc')])]),
      ])

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(1)
      expect(transactions).toMatchSnapshot()
    })

    it('should process a block with IKEY', async () => {
      await processBlocks([
        createBlock([createTransaction([createP2TRInput('cb')])]),
      ])

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(1)
      expect(transactions).toMatchSnapshot()
    })

    it('should correctly handle the annex', async () => {
      const input = createP2TRInput('7e')
      input.txinwitness.push('50')
      await processBlocks([createBlock([createTransaction([input])])])

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(1)
      expect(transactions).toMatchSnapshot()
    })

    it('should ignore inputs that do not use soft forks', async () => {
      await processBlocks([
        createBlock([
          createTransaction([
            // APO outside of P2TR
            createBareInput('51ac'),
            createP2SHInput('51ac'),
            createWrappedP2SHInput('51ac'),
            createP2WSHInput('51ac'),
            // CAT outside of P2TR
            createBareInput('7e'),
            createP2SHInput('7e'),
            createWrappedP2SHInput('7e'),
            createP2WSHInput('7e'),
            // every opcode except CTV and CAT
            createP2TRInput(
              '004f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b4b5b6b7b8b9baff',
            ),
            // data pushes that should not be mistaken for opcodes
            createP2TRInput('01b3'),
            createP2TRInput('0251ac'),
            createP2TRInput('017e'),
          ]),
        ]),
      ])

      const blocks = await getAllBlocks()
      expect(blocks).toHaveLength(1)

      const transactions = await getAllTransactions()
      expect(transactions).toHaveLength(0)
    })
  })

  describe('getStoredBlockByHeight', () => {
    const getStoredBlockByHeight = async (height: number) => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      return new ChainState()['getStoredBlockByHeight'](height)
    }

    it('should return stored blocks by height', async () => {
      await insertBlocks(16)
      await expect(getStoredBlockByHeight(0)).resolves.toMatchSnapshot()
      await expect(getStoredBlockByHeight(5)).resolves.toMatchSnapshot()
      await expect(getStoredBlockByHeight(15)).resolves.toMatchSnapshot()
      await expect(getStoredBlockByHeight(16)).resolves.toBeUndefined()
    })
  })

  describe('getStoredBlockByHash', () => {
    const getStoredBlockByHash = async (hash: string) => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      return new ChainState()['getStoredBlockByHash'](hash)
    }

    it('should return stored blocks by hash', async () => {
      await insertBlocks(16)
      await expect(
        getStoredBlockByHash(
          '0000000000000000000000000000000000000000000000000000000000000000',
        ),
      ).resolves.toMatchSnapshot()
      await expect(
        getStoredBlockByHash(
          '0000000000000000000000000000000000000000000000000000000000000005',
        ),
      ).resolves.toMatchSnapshot()
      await expect(
        getStoredBlockByHash(
          '000000000000000000000000000000000000000000000000000000000000000f',
        ),
      ).resolves.toMatchSnapshot()
      await expect(
        getStoredBlockByHash(
          '0000000000000000000000000000000000000000000000000000000000000010',
        ),
      ).resolves.toBeUndefined()
    })
  })

  describe('getStoredChainTip', () => {
    const getStoredChainTip = async () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      return new ChainState()['getStoredChainTip']()
    }

    it('should return the stored chaintip', async () => {
      await insertBlocks(32)
      await expect(getStoredChainTip()).resolves.toEqual({
        hash: '000000000000000000000000000000000000000000000000000000000000001f',
        height: 31,
      })
    })

    it('should return undefined when there are no blocks', async () => {
      await expect(getStoredChainTip()).resolves.toBeUndefined()
    })
  })

  describe('rollbackStoredChain', () => {
    const rollbackStoredChain = async (chainTip: ChainTip) => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      return new ChainState()['rollbackStoredChain'](chainTip)
    }

    it('should delete blocks above the given height', async () => {
      await insertBlocks(32)
      await expect(getAllBlocks()).resolves.toHaveLength(32)

      await rollbackStoredChain({
        hash: '000000000000000000000000000000000000000000000000000000000000000f',
        height: 15,
      })
      await expect(getAllBlocks()).resolves.toHaveLength(16)
    })
  })
})
