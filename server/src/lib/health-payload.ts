// Builds the JSON payload for /api/health. Centralised so the frontend can
// type the response without keeping the shape in two places.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface HealthPayload {
  status: 'ok' | 'degraded' | 'down'
  service: string
  version: string
  uptimeSeconds: number
  network: 'mainnet' | 'devnet' | 'testnet'
  rpcUrl: string
  cacheHits: number
  cacheMisses: number
  timestamp: string
}

const startTs = Date.now()
let cacheHits = 0
let cacheMisses = 0

export function recordCacheHit(): void { cacheHits += 1 }
export function recordCacheMiss(): void { cacheMisses += 1 }

let cachedVersion: string | null = null
function readVersion(): string {
  if (cachedVersion !== null) return cachedVersion
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
    cachedVersion = pkg.version ?? '0.0.0'
  } catch {
    cachedVersion = '0.0.0'
  }
  return cachedVersion!
}

export function buildHealthPayload(opts: { rpcUrl: string }): HealthPayload {
  const network: HealthPayload['network'] =
    opts.rpcUrl.includes('mainnet') ? 'mainnet'
    : opts.rpcUrl.includes('testnet') ? 'testnet'
    : 'devnet'

  return {
    status: 'ok',
    service: 'cpitracker-server',
    version: readVersion(),
    uptimeSeconds: Math.floor((Date.now() - startTs) / 1000),
    network,
    rpcUrl: opts.rpcUrl.replace(/api-key=[^&]+/, 'api-key=***'),
    cacheHits,
    cacheMisses,
    timestamp: new Date().toISOString(),
  }
}
