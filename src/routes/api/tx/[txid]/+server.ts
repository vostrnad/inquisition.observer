import { error, json } from '@sveltejs/kit'
import { getDatabase } from '$lib/server/db'
import { Transaction } from '$lib/server/db/entities/transaction'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  if (!/^[\da-f]{64}$/.test(params.txid)) {
    throw error(400, 'Invalid TXID')
  }

  const db = await getDatabase()
  const transaction = await db.em
    .fork()
    .getRepository(Transaction)
    .findByTxid(params.txid)

  if (!transaction) {
    throw error(404, 'Transaction not found')
  }

  return json(transaction)
}
