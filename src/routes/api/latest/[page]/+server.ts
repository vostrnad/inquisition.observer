import { error, json } from '@sveltejs/kit'
import { getDatabase } from '$lib/server/db'
import { Transaction } from '$lib/server/db/entities/transaction'
import { bufferToHex } from '$lib/server/utils/buffer'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, request }) => {
  const page = Number(params.page)
  if (!Number.isSafeInteger(page) || page < 0) {
    throw error(400, 'Invalid page number')
  }

  const url = new URL(request.url)
  const type = url.searchParams.get('type')

  let filter

  switch (type) {
    case null:
      filter = {}
      break
    case 'apo':
      filter = { hasApo: true }
      break
    case 'ctv':
      filter = { hasCtv: true }
      break
    case 'cat':
      filter = { hasCat: true }
      break
    default:
      throw error(400, 'Invalid type')
  }

  const db = await getDatabase()
  const [results, total] = await db.em
    .fork()
    .getRepository(Transaction)
    .findAllPaginated({ pagination: { page, pageSize: 20 }, filter })

  const lastTxid = results.at(0)?.txid
  const lastTxidHex = lastTxid ? bufferToHex(lastTxid) : '0'
  const etag = `W/${type || 'all'}:${lastTxidHex}:${results.length}:${total}`

  return json(
    {
      results,
      total,
    },
    {
      headers: {
        etag,
      },
    },
  )
}
