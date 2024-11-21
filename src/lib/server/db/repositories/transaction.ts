import { EntityRepository, type FilterQuery } from '@mikro-orm/better-sqlite'
import { Transaction } from '$lib/server/db/entities/transaction'
import { hexToBuffer } from '$lib/server/utils/buffer'

export interface PaginationOptions {
  page: number
  pageSize: number
}

export interface FilterOptions {
  filter?: FilterQuery<Transaction>
  pagination: PaginationOptions
}

export class TransactionRepository extends EntityRepository<Transaction> {
  public async findByTxid(txid: Buffer | string): Promise<Transaction | null> {
    if (typeof txid === 'string') {
      txid = hexToBuffer(txid)
    }
    return this.findOne({ txid }, { populate: ['*'] })
  }

  public async findAllPaginated(
    options: FilterOptions,
  ): Promise<[Transaction[], number]> {
    return this.findAndCount(options.filter || {}, {
      populate: ['*'],
      orderBy: [{ block: 'desc' }, { blockPosition: 'desc' }],
      limit: options.pagination.pageSize,
      offset: options.pagination.page * options.pagination.pageSize,
    })
  }
}
