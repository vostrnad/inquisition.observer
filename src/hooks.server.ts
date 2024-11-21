import { building } from '$app/environment'
import { startBackgroundProcess } from '$lib/server'

if (!building) {
  startBackgroundProcess()
}
