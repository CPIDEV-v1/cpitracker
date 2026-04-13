/**
 * Transaction Fetcher
 *
 * Fetches a Solana transaction by signature from RPC and
 * validates it has the required metadata for analysis.
 *
 * Uses maxSupportedTransactionVersion: 0 to support both
 * legacy and v0 (address lookup table) transactions.
 *
 * @module core/tx.fetcher
 */

// --- deps ---
import { VersionedTransactionResponse } from '@solana/web3.js';

// --- local ---
import { getConnection } from './rpc.client';
import { ErrorCode, ServerError } from '../types/errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NetworkType = 'mainnet-beta' | 'devnet' | 'testnet';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches a transaction by signature with full metadata.
 *
 * Requests maxSupportedTransactionVersion: 0 so both legacy
 * and v0 transactions are returned. Throws ServerError if
 * the transaction is not found or lacks metadata.
 *
 * @param signature — base58-encoded transaction signature
 * @param network — which Solana network to query
 * @returns VersionedTransactionResponse with non-null meta
 */
export async function fetchTransaction(
  signature: string,
  network: NetworkType = 'mainnet-beta'
): Promise<VersionedTransactionResponse> {
  const connection = getConnection(network);

  console.log(`[fetcher] fetching tx ${signature.slice(0, 12)}... on ${network}`);

  let txResponse: VersionedTransactionResponse | null;

  try {
    txResponse = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      throw new ServerError(
        ErrorCode.RPC_TIMEOUT,
        `RPC timeout while fetching transaction: ${message}`,
        504
      );
    }

    throw new ServerError(
      ErrorCode.RPC_ERROR,
      `RPC error: ${message}`,
      502
    );
  }

  if (!txResponse) {
    throw new ServerError(
      ErrorCode.TRANSACTION_NOT_FOUND,
      `Transaction not found: ${signature}`,
      404
    );
  }

  if (!txResponse.meta) {
    throw new ServerError(
      ErrorCode.PARSE_FAILED,
      'Transaction metadata is missing — transaction may be too old or not yet confirmed',
      422
    );
  }

  console.log(
    `[fetcher] got tx: slot=${txResponse.slot}, ` +
    `instructions=${txResponse.transaction.message.compiledInstructions?.length ?? '?'}, ` +
    `inner=${txResponse.meta.innerInstructions?.length ?? 0}`
  );

  return txResponse;
}
