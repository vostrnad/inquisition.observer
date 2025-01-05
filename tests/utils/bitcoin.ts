import type {
  Block,
  NoncoinbaseInput,
  Transaction,
  TxInput,
  TxOutput,
} from '$lib/server/bitcoin/json-rpc'
import {
  bufferConcat,
  bufferToHex,
  ensureHex,
  hexToBuffer,
} from '$lib/server/utils/buffer'
import { unique } from './unique'

const bytesToMinimalPush = (bytes: Buffer | string): Buffer => {
  if (typeof bytes === 'string') {
    bytes = hexToBuffer(bytes)
  }
  if (bytes.length === 0) {
    return bufferConcat([0x00])
  }
  if (bytes.length === 1) {
    const byte = bytes[0]
    if (byte >= 1 && byte <= 16) {
      return bufferConcat([byte + 0x50])
    }
    if (byte === 0x81) {
      return bufferConcat([0x4f])
    }
  }
  if (bytes.length <= 75) {
    return bufferConcat([bytes.length, bytes])
  }
  if (bytes.length <= 255) {
    return bufferConcat([0x4c, bytes.length, bytes])
  }
  if (bytes.length <= 65535) {
    const sizeBuffer = Buffer.alloc(2)
    sizeBuffer.writeUInt16LE(bytes.length)
    return bufferConcat([0x4d, sizeBuffer, bytes])
  }
  const sizeBuffer = Buffer.alloc(4)
  sizeBuffer.writeUInt32LE(bytes.length)
  return bufferConcat([0x4e, sizeBuffer, bytes])
}

const baseInput: Required<NoncoinbaseInput> = {
  txid: '0000000000000000000000000000000000000000000000000000000000000000',
  vout: 0,
  scriptSig: {
    hex: '',
  },
  prevout: {
    value: 0.01,
    scriptPubKey: {
      hex: '',
      address: '',
      type: 'nonstandard',
    },
  },
  txinwitness: [],
  sequence: 0,
}

export const createBareInput = (
  script: Buffer | string,
): Required<NoncoinbaseInput> => {
  const input = structuredClone(baseInput)
  input.prevout.scriptPubKey = {
    hex: ensureHex(script),
    type: 'nonstandard',
  }
  return input
}

export const createP2SHInput = (
  script: Buffer | string,
): Required<NoncoinbaseInput> => {
  const input = structuredClone(baseInput)
  input.scriptSig.hex = bufferToHex(bytesToMinimalPush(script))
  input.prevout.scriptPubKey = {
    hex: 'a914000000000000000000000000000000000000000087',
    address: '3p2sh',
    type: 'scripthash',
  }
  return input
}

export const createWrappedP2SHInput = (
  script: Buffer | string,
): Required<NoncoinbaseInput> => {
  const input = createP2SHInput(
    '00200000000000000000000000000000000000000000000000000000000000000000',
  )
  input.txinwitness = [ensureHex(script)]
  return input
}

export const createP2WSHInput = (
  script: Buffer | string,
): Required<NoncoinbaseInput> => {
  const input = structuredClone(baseInput)
  input.prevout.scriptPubKey = {
    hex: '00200000000000000000000000000000000000000000000000000000000000000000',
    address: 'bc1qp2wsh',
    type: 'witness_v0_scripthash',
  }
  input.txinwitness = [ensureHex(script)]
  return input
}

export const createP2TRInput = (
  script: Buffer | string,
): Required<NoncoinbaseInput> => {
  const input = structuredClone(baseInput)
  input.prevout.scriptPubKey = {
    hex: '51200000000000000000000000000000000000000000000000000000000000000000',
    address: 'bc1pp2tr',
    type: 'witness_v1_taproot',
  }
  input.txinwitness = [
    ensureHex(script),
    'c10000000000000000000000000000000000000000000000000000000000000000',
  ]
  return input
}

export const createOpReturnOutput = (): TxOutput => {
  return {
    value: 0,
    scriptPubKey: {
      hex: '6a',
      type: 'nulldata',
    },
  }
}

export const createTransaction = (inputs: TxInput[]): Transaction => {
  const txid = unique.hash('txid')
  return {
    txid,
    hash: txid,
    version: 1,
    size: 100,
    vsize: 100,
    weight: 400,
    locktime: 0,
    fee: 0,
    vin: inputs,
    vout: [createOpReturnOutput()],
  }
}

export const createBlock = (transactions: Transaction[]): Block => {
  const coinbase = createTransaction([{ coinbase: '', sequence: 0 }])
  return {
    hash: unique.hash('blockhash'),
    height: unique.integer('blockheight', 12),
    confirmations: 1,
    time: 7200,
    mediantime: 3600,
    nTx: transactions.length + 1,
    tx: [coinbase, ...transactions],
  }
}
