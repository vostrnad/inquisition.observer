export const createArray = <T>(length: number, fn: (index: number) => T): T[] =>
  Array.from({ length }).map((_, i) => fn(i))

export const sum = (array: number[]): number =>
  array.reduce((prev, curr) => prev + curr, 0)
