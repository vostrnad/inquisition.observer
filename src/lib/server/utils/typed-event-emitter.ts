/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
type EventListener<
  T extends Record<string, unknown>,
  K extends keyof T & string,
> = T[K] extends undefined ? () => void : (data: T[K]) => void

type GetKeysWhereValueIsType<T, K extends keyof T, V> = K extends K
  ? T[K] extends V
    ? K
    : never
  : never

type GetKeysWhereValueIsNotType<T, K extends keyof T, V> = K extends K
  ? T[K] extends V
    ? never
    : K
  : never

type NoArgEvents<T extends Record<string, unknown>> = GetKeysWhereValueIsType<
  T,
  keyof T & string,
  undefined
>

type ArgEvents<T extends Record<string, unknown>> = GetKeysWhereValueIsNotType<
  T,
  keyof T & string,
  undefined
>

export interface TypedEventEmitter<T extends Record<string, unknown>> {
  addListener<K extends keyof T & string>(
    eventName: K,
    listener: EventListener<T, K>,
  ): this

  on<K extends keyof T & string>(
    eventName: K,
    listener: EventListener<T, K>,
  ): this

  once<K extends keyof T & string>(
    eventName: K,
    listener: EventListener<T, K>,
  ): this

  removeListener<K extends keyof T & string>(
    eventName: K,
    listener: EventListener<T, K>,
  ): this

  off<K extends keyof T & string>(
    eventName: K,
    listener: EventListener<T, K>,
  ): this

  removeAllListeners<K extends keyof T & string>(eventName?: K): this

  setMaxListeners(n: number): this

  getMaxListeners(): number

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  listeners<K extends keyof T & string>(eventName: K): Function[]

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  rawListeners<K extends keyof T & string>(eventName: K): Function[]

  emit<K extends NoArgEvents<T>>(eventName: K): boolean
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  emit<K extends ArgEvents<T>>(eventName: K, arg: T[K]): boolean

  listenerCount<K extends keyof T & string>(eventName: K): number

  prependListener<K extends keyof T & string>(
    eventName: K,
    listener: EventListener<T, K>,
  ): this

  prependOnceListener<K extends keyof T & string>(
    eventName: K,
    listener: EventListener<T, K>,
  ): this
}
