import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

type LoadEnvConfigFn = (
  dir: string,
  dev?: boolean,
  log?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void },
  forceReload?: boolean,
  onReload?: (envFilePath: string) => void
) => {
  combinedEnv: Record<string, string | undefined>
  parsedEnv: Record<string, string | undefined> | undefined
  loadedEnvFiles: Array<{ path: string; contents: string; env: Record<string, string | undefined> }>
}

/** @next/env is CJS; named ESM imports break when next.config.ts loads as ESM. */
export function loadEnvConfig(dir: string, dev?: boolean) {
  const { loadEnvConfig: load } = require('@next/env') as { loadEnvConfig: LoadEnvConfigFn }
  return load(dir, dev)
}
