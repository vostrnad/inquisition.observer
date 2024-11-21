export interface SerializedTransaction extends SoftForkFlags {
  txid: string
  vsize: number
  blockPosition: number
  block: {
    hash: string
    height: number
    time: number
  }
  inputs: SerializedTransactionInput[]
}

export interface SerializedTransactionInput extends SoftForkFlags {
  inputIndex: number
  address?: string
  type: string
  scriptAsm: string
}

export interface SoftForkFlags {
  hasApo: boolean
  hasCtv: boolean
  hasCat: boolean
}
