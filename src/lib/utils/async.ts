export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const delay = async <T>(ms: number, promise: Promise<T>): Promise<T> => {
  const started = Date.now()

  const result = await promise

  if (Date.now() - started < ms) {
    await sleep(started + ms - Date.now())
  }

  return result
}
