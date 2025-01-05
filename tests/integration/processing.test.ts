import { describe, expect, it } from 'vitest'
import { getTransactionEntity } from '$lib/server/bitcoin/processing'
import { createTransaction } from '$tests/utils/bitcoin'

describe('getTransactionEntity', () => {
  it('should return undefined for an empty transaction', () => {
    expect(getTransactionEntity(createTransaction([]), 1, 1)).toBeUndefined()
  })
})
