import type { PageLoad } from './$types'

export interface Counts {
  blocks: number
  transactions: number
  apo: number
  ctv: number
  cat: number
  csfs: number
  ikey: number
}

export const load: PageLoad = async ({ fetch }) => {
  return fetch('/api/count').then(async (res) => res.json() as Promise<Counts>)
}
