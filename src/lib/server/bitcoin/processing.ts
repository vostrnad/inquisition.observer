import { wrap } from '@mikro-orm/core'
import { Transaction } from '$lib/server/db/entities/transaction'
import {
  InputType,
  TransactionInput,
} from '$lib/server/db/entities/transaction-input'
import { hexToBuffer } from '$lib/server/utils/buffer'
import { type Transaction as RpcTransaction } from './json-rpc'
import { decodeScript, getAllScriptPushes } from './script'
import { isP2WPKH, isP2WSH } from './utils'

export const getTransactionEntity = (
  tx: RpcTransaction,
  _blockHeight: number,
  blockPosition: number,
): Transaction | undefined => {
  const transactionInputs: TransactionInput[] = []

  for (let inputIndex = 0; inputIndex < tx.vin.length; inputIndex++) {
    const input = tx.vin[inputIndex]

    if ('coinbase' in input) {
      continue
    }

    if (!input.prevout) {
      throw new Error('no prevout')
    }

    const witness = input.txinwitness || []
    const prevoutType = input.prevout.scriptPubKey.type

    let type: TransactionInput['type']
    let script: Buffer

    switch (prevoutType) {
      case 'nulldata':
      case 'pubkey':
      case 'pubkeyhash':
      case 'multisig':
      case 'witness_v0_keyhash':
      case 'anchor':
      case 'witness_unknown':
        continue
      case 'scripthash':
        type = InputType.p2sh
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        script = getAllScriptPushes(input.scriptSig.hex).at(-1)!

        if (isP2WPKH(script)) {
          continue
        }
        if (isP2WSH(script)) {
          if (witness.length === 0) {
            continue
          }
          type = InputType.p2shP2wsh
          script = hexToBuffer(witness[witness.length - 1])
        }
        break
      case 'witness_v0_scripthash':
        if (witness.length === 0) {
          continue
        }
        type = InputType.p2wsh
        script = hexToBuffer(witness[witness.length - 1])
        break
      case 'witness_v1_taproot': {
        if (witness.length === 0) {
          continue
        }
        let tempWitness = witness
        // check for annex and remove it
        if (
          tempWitness.length > 1 &&
          tempWitness[tempWitness.length - 1].startsWith('50')
        ) {
          tempWitness = tempWitness.slice(0, -1)
        }
        if (tempWitness.length < 2) {
          continue
        }
        type = InputType.p2tr
        script = hexToBuffer(tempWitness[tempWitness.length - 2])
        break
      }
      // eslint-disable-next-line unicorn/no-useless-switch-case
      case 'nonstandard':
      default:
        type = InputType.bare
        script = hexToBuffer(input.prevout.scriptPubKey.hex)
        break
    }

    const scriptAsm = decodeScript(script, {
      showPushOps: 'none',
      showShortDecimal: false,
    })

    const hasApo =
      type === InputType.p2tr &&
      /\b01([\da-f]{64})? OP_CHECKSIG(VERIFY|ADD|)\b/.test(scriptAsm)

    const hasCtv = scriptAsm.includes('OP_CHECKTEMPLATEVERIFY')

    const hasCat = type === InputType.p2tr && scriptAsm.includes('OP_CAT')

    const hasCsfs =
      type === InputType.p2tr && scriptAsm.includes('OP_CHECKSIGFROMSTACK')

    const hasIkey =
      type === InputType.p2tr && scriptAsm.includes('OP_INTERNALKEY')

    if (hasApo || hasCtv || hasCat || hasCsfs || hasIkey) {
      transactionInputs.push(
        wrap(new TransactionInput()).assign({
          inputIndex,
          address: input.prevout.scriptPubKey.address,
          type,
          script,
          hasApo,
          hasCtv,
          hasCat,
          hasCsfs,
          hasIkey,
        }),
      )
    }
  }

  if (transactionInputs.length > 0) {
    return wrap(new Transaction()).assign({
      txid: hexToBuffer(tx.txid),
      vsize: tx.vsize,
      blockPosition,
      inputs: transactionInputs,
      hasApo: transactionInputs.some((input) => input.hasApo),
      hasCtv: transactionInputs.some((input) => input.hasCtv),
      hasCat: transactionInputs.some((input) => input.hasCat),
      hasCsfs: transactionInputs.some((input) => input.hasCsfs),
      hasIkey: transactionInputs.some((input) => input.hasIkey),
    })
  } else {
    return undefined
  }
}
