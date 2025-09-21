import { json } from '@sveltejs/kit'
import { getDatabase } from '$lib/server/db'
import { Block } from '$lib/server/db/entities/block'
import { Transaction } from '$lib/server/db/entities/transaction'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  const db = await getDatabase()
  const em = db.em.fork()

  const blockRepository = em.getRepository(Block)
  const transactionRepository = em.getRepository(Transaction)

  const blocks = (await blockRepository.findBestBlock())?.height || 0
  const transactions = await transactionRepository.count()
  const apo = await transactionRepository.count({ hasApo: true })
  const ctv = await transactionRepository.count({ hasCtv: true })
  const cat = await transactionRepository.count({ hasCat: true })
  const csfs = await transactionRepository.count({ hasCsfs: true })
  const ikey = await transactionRepository.count({ hasIkey: true })

  return json({
    blocks,
    transactions,
    apo,
    ctv,
    cat,
    csfs,
    ikey,
  })
}
