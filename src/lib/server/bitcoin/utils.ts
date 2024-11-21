export const isP2WPKH = (script: Buffer): boolean => {
  return script.length === 22 && script[0] === 0x00 && script[1] === 0x14
}

export const isP2WSH = (script: Buffer): boolean => {
  return script.length === 34 && script[0] === 0x00 && script[1] === 0x20
}
