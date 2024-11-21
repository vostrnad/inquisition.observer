import {
  BufferReader,
  bufferToHex,
  bufferToIntLE,
  bufferToUIntLE,
  hexToBuffer,
} from '$lib/server/utils/buffer'

const opcodes = new Map<number, string>([
  [0x50, 'OP_RESERVED'],

  // control
  [0x61, 'OP_NOP'],
  [0x62, 'OP_VER'],
  [0x63, 'OP_IF'],
  [0x64, 'OP_NOTIF'],
  [0x65, 'OP_VERIF'],
  [0x66, 'OP_VERNOTIF'],
  [0x67, 'OP_ELSE'],
  [0x68, 'OP_ENDIF'],
  [0x69, 'OP_VERIFY'],
  [0x6a, 'OP_RETURN'],

  // stack ops
  [0x6b, 'OP_TOALTSTACK'],
  [0x6c, 'OP_FROMALTSTACK'],
  [0x6d, 'OP_2DROP'],
  [0x6e, 'OP_2DUP'],
  [0x6f, 'OP_3DUP'],
  [0x70, 'OP_2OVER'],
  [0x71, 'OP_2ROT'],
  [0x72, 'OP_2SWAP'],
  [0x73, 'OP_IFDUP'],
  [0x74, 'OP_DEPTH'],
  [0x75, 'OP_DROP'],
  [0x76, 'OP_DUP'],
  [0x77, 'OP_NIP'],
  [0x78, 'OP_OVER'],
  [0x79, 'OP_PICK'],
  [0x7a, 'OP_ROLL'],
  [0x7b, 'OP_ROT'],
  [0x7c, 'OP_SWAP'],
  [0x7d, 'OP_TUCK'],

  // splice ops
  [0x7e, 'OP_CAT'],
  [0x7f, 'OP_SUBSTR'],
  [0x80, 'OP_LEFT'],
  [0x81, 'OP_RIGHT'],
  [0x82, 'OP_SIZE'],

  // bit logic
  [0x83, 'OP_INVERT'],
  [0x84, 'OP_AND'],
  [0x85, 'OP_OR'],
  [0x86, 'OP_XOR'],
  [0x87, 'OP_EQUAL'],
  [0x88, 'OP_EQUALVERIFY'],
  [0x89, 'OP_RESERVED1'],
  [0x8a, 'OP_RESERVED2'],

  // numeric
  [0x8b, 'OP_1ADD'],
  [0x8c, 'OP_1SUB'],
  [0x8d, 'OP_2MUL'],
  [0x8e, 'OP_2DIV'],
  [0x8f, 'OP_NEGATE'],
  [0x90, 'OP_ABS'],
  [0x91, 'OP_NOT'],
  [0x92, 'OP_0NOTEQUAL'],

  [0x93, 'OP_ADD'],
  [0x94, 'OP_SUB'],
  [0x95, 'OP_MUL'],
  [0x96, 'OP_DIV'],
  [0x97, 'OP_MOD'],
  [0x98, 'OP_LSHIFT'],
  [0x99, 'OP_RSHIFT'],

  [0x9a, 'OP_BOOLAND'],
  [0x9b, 'OP_BOOLOR'],
  [0x9c, 'OP_NUMEQUAL'],
  [0x9d, 'OP_NUMEQUALVERIFY'],
  [0x9e, 'OP_NUMNOTEQUAL'],
  [0x9f, 'OP_LESSTHAN'],
  [0xa0, 'OP_GREATERTHAN'],
  [0xa1, 'OP_LESSTHANOREQUAL'],
  [0xa2, 'OP_GREATERTHANOREQUAL'],
  [0xa3, 'OP_MIN'],
  [0xa4, 'OP_MAX'],

  [0xa5, 'OP_WITHIN'],

  // crypto
  [0xa6, 'OP_RIPEMD160'],
  [0xa7, 'OP_SHA1'],
  [0xa8, 'OP_SHA256'],
  [0xa9, 'OP_HASH160'],
  [0xaa, 'OP_HASH256'],
  [0xab, 'OP_CODESEPARATOR'],
  [0xac, 'OP_CHECKSIG'],
  [0xad, 'OP_CHECKSIGVERIFY'],
  [0xae, 'OP_CHECKMULTISIG'],
  [0xaf, 'OP_CHECKMULTISIGVERIFY'],

  // expansion
  [0xb0, 'OP_NOP1'],
  [0xb1, 'OP_CHECKLOCKTIMEVERIFY'],
  [0xb2, 'OP_CHECKSEQUENCEVERIFY'],
  [0xb3, 'OP_CHECKTEMPLATEVERIFY'],
  [0xb4, 'OP_NOP5'],
  [0xb5, 'OP_NOP6'],
  [0xb6, 'OP_NOP7'],
  [0xb7, 'OP_NOP8'],
  [0xb8, 'OP_NOP9'],
  [0xb9, 'OP_NOP10'],

  // Opcode added by BIP 342 (Tapscript)
  [0xba, 'OP_CHECKSIGADD'],

  [0xff, 'OP_INVALIDOPCODE'],
])

const OP_0 = 0x00

const OP_PUSHBYTES_1 = 0x01
const OP_PUSHBYTES_75 = 0x4b

const OP_PUSHDATA1 = 0x4c
//    OP_PUSHDATA2 = 0x4d
const OP_PUSHDATA4 = 0x4e

const OP_1 = 0x51
const OP_16 = 0x60

const OP_1NEGATE = 0x4f

export interface DecodeOptions {
  pushNumFormat: 'short' | 'long'
  showPushOps: 'all' | 'numeric' | 'none'
  showPushdataSize: boolean
  showShortDecimal: boolean
}

export function* getDecodeScriptGenerator(
  script: string | Buffer,
  options?: Partial<DecodeOptions>,
): Generator<string | Buffer> {
  if (typeof script === 'string') {
    script = hexToBuffer(script)
  }

  const reader = new BufferReader(script)

  options = {
    pushNumFormat: 'short',
    showPushOps: 'all',
    showPushdataSize: true,
    showShortDecimal: false,
    ...options,
  }

  while (reader.position < script.length) {
    const byte = reader.readByte()

    const opcode = opcodes.get(byte)

    if (opcode) {
      yield opcode
      continue
    }

    if (byte === OP_0 || (byte >= OP_1 && byte <= OP_16)) {
      const number = byte === OP_0 ? 0 : byte - OP_1 + 1
      if (options.showPushOps !== 'none') {
        if (byte === OP_0) {
          yield 'OP_0'
        } else if (options.pushNumFormat === 'short') {
          yield `OP_${number}`
        } else {
          yield `OP_PUSHNUM_${number}`
        }
      } else {
        if (options.showShortDecimal) {
          yield number.toString()
        } else {
          yield Buffer.from([number])
        }
      }
      continue
    }

    if (byte === OP_1NEGATE) {
      if (options.showPushOps !== 'none') {
        yield 'OP_1NEGATE'
      } else if (options.showShortDecimal) {
        yield '-1'
      } else {
        yield Buffer.from([0x81])
      }
      continue
    }

    if (byte >= OP_PUSHBYTES_1 && byte <= OP_PUSHDATA4) {
      let pushBytes: number

      if (byte <= OP_PUSHBYTES_75) {
        pushBytes = byte
        if (options.showPushOps === 'all') yield `OP_PUSHBYTES_${byte}`
      } else {
        const lengthBytes = 2 ** (byte - OP_PUSHDATA1)
        if (options.showPushOps === 'all') yield `OP_PUSHDATA${lengthBytes}`

        const pushBytesArray = reader.read(lengthBytes)
        pushBytes = bufferToUIntLE(pushBytesArray)
        if (options.showPushOps === 'all' && options.showPushdataSize) {
          if (options.showShortDecimal) {
            yield pushBytes.toString()
          } else {
            yield bufferToHex(pushBytesArray)
          }
        }
      }

      const subarray = reader.read(pushBytes)
      if (pushBytes <= 4 && options.showShortDecimal) {
        yield bufferToIntLE(subarray).toString()
      } else {
        yield subarray
      }
      continue
    }

    yield `OP_UNKNOWN`
  }
}

export const decodeScript = (
  script: string | Buffer,
  options?: Partial<DecodeOptions>,
): string => {
  return Array.from(getDecodeScriptGenerator(script, options))
    .map((chunk) => {
      if (chunk instanceof Uint8Array) {
        chunk = bufferToHex(chunk) || '0'
      }
      return chunk
    })
    .join(' ')
}

export const getAllScriptPushes = (script: string | Buffer): Buffer[] => {
  return Array.from(
    getDecodeScriptGenerator(script, {
      showPushOps: 'none',
      showShortDecimal: false,
    }),
  )
    .filter((chunk) => chunk instanceof Buffer)
    .map((chunk) => Buffer.from(chunk))
}
