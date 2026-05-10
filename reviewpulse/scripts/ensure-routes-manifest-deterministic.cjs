/**
 * Vercel's Next.js integration may lstat `.next/routes-manifest-deterministic.json` after build.
 * Some Next/webpack builds only emit `routes-manifest.json`. Duplicate it when missing so deploy can proceed.
 * @see https://community.vercel.com/t/git-integration-fails-after-build-looking-for-routes-manifest-in-repo-root/40519
 */
const fs = require('node:fs')
const path = require('node:path')

const nextDir = path.join(process.cwd(), '.next')
const base = path.join(nextDir, 'routes-manifest.json')
const deterministic = path.join(nextDir, 'routes-manifest-deterministic.json')

if (!fs.existsSync(nextDir)) {
  console.warn('[ensure-routes-manifest-deterministic] .next missing; skip')
  process.exit(0)
}

if (!fs.existsSync(base)) {
  console.warn('[ensure-routes-manifest-deterministic] routes-manifest.json missing; skip')
  process.exit(0)
}

if (fs.existsSync(deterministic)) {
  process.exit(0)
}

fs.copyFileSync(base, deterministic)
console.log('[ensure-routes-manifest-deterministic] wrote', deterministic)
