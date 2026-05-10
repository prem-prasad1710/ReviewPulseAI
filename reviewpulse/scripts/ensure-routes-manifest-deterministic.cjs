/**
 * Vercel finalization may `lstat` `/vercel/path0/.next/routes-manifest-deterministic.json`.
 * - Some Next/webpack builds only emit `routes-manifest.json`.
 * - On Vercel, the compiled app can live under `/vercel/output/.next` while finalize still checks `cwd/.next`.
 * This script ensures `routes-manifest-deterministic.json` exists everywhere we find a `routes-manifest.json`.
 */
const fs = require('node:fs')
const path = require('node:path')

/**
 * @param {string} nextDir
 * @returns {boolean}
 */
function ensureDeterministic(nextDir) {
  const base = path.join(nextDir, 'routes-manifest.json')
  const deterministic = path.join(nextDir, 'routes-manifest-deterministic.json')
  if (!fs.existsSync(nextDir)) return false
  if (!fs.existsSync(base)) return false
  if (fs.existsSync(deterministic)) return true
  fs.copyFileSync(base, deterministic)
  console.log('[ensure-routes-manifest-deterministic] wrote', deterministic)
  return true
}

/**
 * Mirror routes-manifest*.json from srcNext -> destNext (creates destNext if needed).
 * Used when build artifacts live under /vercel/output but finalize reads cwd/.next.
 * @param {string} srcNext
 * @param {string} destNext
 */
function mirrorManifests(srcNext, destNext) {
  const srcBase = path.join(srcNext, 'routes-manifest.json')
  if (!fs.existsSync(srcBase)) return false
  fs.mkdirSync(destNext, { recursive: true })
  const destBase = path.join(destNext, 'routes-manifest.json')
  const destDet = path.join(destNext, 'routes-manifest-deterministic.json')
  fs.copyFileSync(srcBase, destBase)
  fs.copyFileSync(srcBase, destDet)
  console.log('[ensure-routes-manifest-deterministic] mirrored manifests', srcNext, '->', destNext)
  return true
}

const cwd = process.cwd()
const cwdNext = path.join(cwd, '.next')
/** Vercel Build Output API layout (when present). */
const vercelOutputNext = '/vercel/output/.next'
/** Only touch path0 when that workspace exists (Vercel build VM). */
const path0Root = '/vercel/path0'
const path0Next = fs.existsSync(path0Root) ? path.join(path0Root, '.next') : null

const candidates = [...new Set([cwdNext, vercelOutputNext, path0Next].filter(Boolean))]
const seen = new Set()

for (const nextDir of candidates) {
  if (seen.has(nextDir)) continue
  seen.add(nextDir)
  ensureDeterministic(nextDir)
}

// If output has manifests but cwd/path0 finalize target is missing deterministic, mirror from output.
const sources = [vercelOutputNext, cwdNext].filter((d) => fs.existsSync(path.join(d, 'routes-manifest.json')))
const targets = [cwdNext, path0Next].filter(Boolean).filter((d) => d !== vercelOutputNext)

for (const src of sources) {
  for (const dest of targets) {
    if (src === dest) continue
    const needDet = !fs.existsSync(path.join(dest, 'routes-manifest-deterministic.json'))
    const hasSrc = fs.existsSync(path.join(src, 'routes-manifest.json'))
    if (needDet && hasSrc) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
      }
      mirrorManifests(src, dest)
    }
  }
}

// Final pass: any target that has base but not deterministic
for (const nextDir of [cwdNext, path0Next, vercelOutputNext].filter(Boolean)) {
  ensureDeterministic(nextDir)
}

console.log('[ensure-routes-manifest-deterministic] done cwd=', cwd)
