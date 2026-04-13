/**
 * RPC Client
 *
 * Manages Solana RPC connections for mainnet and devnet.
 * Lazily creates Connection instances on first use so we
 * don't hit rate limits during startup.
 *
 * Uses Helius enhanced RPC when HELIUS_API_KEY is set,
 * falls back to public endpoints otherwise.
 *
 * @module core/rpc.client
 */

// --- deps ---
import { Connection, Commitment } from '@solana/web3.js';

// ---------------------------------------------------------------------------
// Connection cache — one per network
// ---------------------------------------------------------------------------

const connectionCache: Map<string, Connection> = new Map();

const DEFAULT_COMMITMENT: Commitment = 'confirmed';

/**
 * Returns a Connection for the given Solana network.
 *
 * Caches connections so repeated calls return the same instance.
 * Reads RPC_URL / DEVNET_RPC_URL from process.env; falls back
 * to public RPCs (rate-limited, not recommended for production).
 *
 * @param network — "mainnet-beta" | "devnet" | "testnet"
 */
export function getConnection(
  network: 'mainnet-beta' | 'devnet' | 'testnet' = 'mainnet-beta'
): Connection {
  const cached = connectionCache.get(network);
  if (cached) return cached;

  const rpcUrl = resolveRpcUrl(network);
  console.log(`[rpc] creating connection: ${network} → ${maskUrl(rpcUrl)}`);

  const connection = new Connection(rpcUrl, {
    commitment: DEFAULT_COMMITMENT,
    confirmTransactionInitialTimeout: 30_000,
  });

  connectionCache.set(network, connection);
  return connection;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the RPC URL for a network from environment variables.
 */
function resolveRpcUrl(network: string): string {
  switch (network) {
    case 'devnet':
      return process.env.DEVNET_RPC_URL || 'https://api.devnet.solana.com';
    case 'testnet':
      return 'https://api.testnet.solana.com';
    case 'mainnet-beta':
    default:
      return process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
  }
}

/**
 * Masks the API key portion of an RPC URL for safe logging.
 * "https://mainnet.helius-rpc.com/?api-key=abc123" → "https://mainnet.helius-rpc.com/?api-key=abc..."
 */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const apiKey = parsed.searchParams.get('api-key');
    if (apiKey && apiKey.length > 6) {
      parsed.searchParams.set('api-key', apiKey.slice(0, 3) + '...');
    }
    return parsed.toString();
  } catch {
    return url.slice(0, 40) + '...';
  }
}
