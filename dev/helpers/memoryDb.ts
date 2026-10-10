import { MongoMemoryReplSet } from 'mongodb-memory-server'

/**
 * Cached on `globalThis` so it survives module re-evaluation: Next dev HMR and
 * `payload.reload()` re-run `startMemoryMongo` every cycle, and a module-scoped variable
 * would spawn a fresh mongod each time while orphaning the previous one. The promise is
 * cached so concurrent callers share one instance.
 */
const globalForMongo = globalThis as {
  __enhancedSidebarDevMemoryMongo?: Promise<MongoMemoryReplSet>
} & typeof globalThis

/**
 * WiredTiger preallocates 3x100 MB of journal on start, and on Windows the dbPath is never
 * removed because `next dev` force-kills this process before the signal handler below runs.
 * Capping the log keeps each orphaned dir around 11 MB instead of 300 MB.
 */
const JOURNAL_ARGS = ['--wiredTigerEngineConfigString', 'log=(file_max=10MB,prealloc=false)']

/**
 * Start a throwaway in-memory MongoDB replica set when no external `DATABASE_URI` is
 * provided, so `pnpm dev` needs no Docker or installed Mongo. A replica set (not a
 * standalone) so transactions behave as in prod. Stopped on SIGINT/SIGTERM, and idempotent
 * per process: reloads reuse the one running mongod.
 */
export const startMemoryMongo = async (): Promise<string> => {
  // `next build` imports the config to collect page data but never connects.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'mongodb://127.0.0.1:27017/payload-build-placeholder'
  }

  if (!globalForMongo.__enhancedSidebarDevMemoryMongo) {
    globalForMongo.__enhancedSidebarDevMemoryMongo = MongoMemoryReplSet.create({
      replSet: { args: JOURNAL_ARGS, count: 1 },
    })

    /**
     * Signals only: an `exit` listener cannot await, so stopping from there never gets past
     * the first tick and leaves a mongod behind. Re-raise after the stop to exit properly.
     */
    const stop = async (signal: NodeJS.Signals): Promise<void> => {
      const pending = globalForMongo.__enhancedSidebarDevMemoryMongo
      globalForMongo.__enhancedSidebarDevMemoryMongo = undefined
      await pending?.then((replSet) => replSet.stop())
      process.kill(process.pid, signal)
    }

    process.once('SIGINT', () => void stop('SIGINT'))
    process.once('SIGTERM', () => void stop('SIGTERM'))
  }

  return (await globalForMongo.__enhancedSidebarDevMemoryMongo).getUri()
}
