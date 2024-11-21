/* eslint-disable no-console */
import { ChainState } from './bitcoin/chain-state'
import { getDatabase } from './db'

export const startBackgroundProcess = (): void => {
  if (import.meta.env.DEV) {
    if (process.DEV_BACKGROUND_PROCESS_STARTED) {
      console.warn(
        'Background process is already running, restart the dev server to update it',
      )
      return
    }
    process.DEV_BACKGROUND_PROCESS_STARTED = true
  }

  console.log('starting server')

  const chainState = new ChainState()

  chainState.on('syncstart', () => {
    console.log('sync start')
  })

  chainState.on('syncend', () => {
    console.log('sync end')
  })

  chainState.on('chaintipupdate', (chainTip) => {
    console.log('new chain tip:', chainTip.height)
  })

  chainState.on('error', (e) => {
    console.error('chain state error:', e)
  })

  chainState.start()

  process.on('SIGINT', () => {
    chainState.stop()
    void getDatabase().then(async (db) => db.close())
  })
}
