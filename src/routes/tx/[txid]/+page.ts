import { redirect } from '@sveltejs/kit'
import type { SerializedTransaction } from '$lib/types'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params }) => {
  const txid = params.txid
  const lowercaseTxid = txid.toLowerCase()
  if (txid !== lowercaseTxid) {
    throw redirect(302, `/tx/${lowercaseTxid}`)
  }
  const res = await fetch(`/api/tx/${params.txid}`)
  if (res.status >= 400) {
    return { error: res.status }
  }
  return res.json() as Promise<SerializedTransaction>
}
