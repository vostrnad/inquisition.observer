import { type EntityDTO, PrimaryKey, wrap } from '@mikro-orm/core'
import { bufferToHex } from '$lib/server/utils/buffer'

export abstract class CustomBaseEntity {
  @PrimaryKey({ type: 'integer', autoincrement: true, hidden: true })
  id!: number

  /* eslint-disable @typescript-eslint/ban-ts-comment */
  toJSON(...args: unknown[]): EntityDTO<this, never> {
    // @ts-expect-error
    const o = wrap(this, true).toObject(...args)

    for (const key in o) {
      // @ts-expect-error
      if (o[key] instanceof Buffer) {
        // @ts-expect-error
        o[key] = bufferToHex(o[key])
      }
    }

    return o
  }
  /* eslint-enable @typescript-eslint/ban-ts-comment */
}
