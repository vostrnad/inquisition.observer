import { sum } from '$lib/utils/array'

export const hexToBuffer = (hex: string): Buffer => Buffer.from(hex, 'hex')

export const bufferToHex = (buffer: Buffer): string => buffer.toString('hex')

export const ensureHex = (input: Buffer | string): string => {
  if (typeof input !== 'string') {
    input = bufferToHex(input)
  }
  return input
}

export const bufferToUIntLE = (buffer: Buffer): number => {
  return sum(Array.from(buffer).map((byte, index) => byte * 256 ** index))
}

export const bufferToIntLE = (buffer: Buffer): number => {
  const uint = bufferToUIntLE(buffer)
  const midpoint = 128 * 256 ** (buffer.length - 1)
  if (uint < midpoint) {
    return uint
  }
  return midpoint - uint
}

export const bufferConcat = (list: Array<Uint8Array | number>): Buffer => {
  return Buffer.concat(
    list.map((value) => {
      if (typeof value === 'number') {
        value = Buffer.from([value])
      }
      return value
    }),
  )
}

export class BufferReader {
  public readonly buffer: Buffer
  public position: number

  constructor(buffer: Buffer, offset = 0) {
    this.buffer = buffer
    this.position = offset
  }

  public read(size: number): Buffer {
    const endPosition = this.position + size
    const res = this.buffer.subarray(this.position, endPosition)
    this.position = endPosition
    return res
  }

  public readByte(): number {
    return this.buffer[this.position++]
  }
}
