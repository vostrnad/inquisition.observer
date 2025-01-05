import { rm } from 'fs/promises'
import { afterAll, afterEach, beforeEach } from 'vitest'
import { testDir } from '$lib/server/config'
import { closeDatabaseIfConnected } from '$lib/server/db'
import { unique } from './utils/unique'

const removeTestDirectory = async () => {
  await rm(testDir, { recursive: true, force: true })
}

beforeEach(async () => {
  await removeTestDirectory()
  unique.reset()
})

afterEach(async () => {
  await closeDatabaseIfConnected()
})

afterAll(async () => {
  await removeTestDirectory()
})
