/**
 * React Query hook for fetching transaction analysis from the API.
 */

import { useQuery } from '@tanstack/react-query';
import type { TransactionAnalysis } from '../types/analysis';

const BASE58_SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;

async function fetchTransactionAnalysis(
  transactionSignature: string,
  networkId: string
): Promise<TransactionAnalysis> {
  if (!BASE58_SIGNATURE_PATTERN.test(transactionSignature)) {
    throw new Error(
      'Invalid signature — must be 80-90 Base58 characters. Check you copied the full transaction hash.'
    );
  }

  const queryString = networkId !== 'mainnet-beta' ? `?network=${networkId}` : '';
  const apiUrl = `/api/analyze/${encodeURIComponent(transactionSignature)}${queryString}`;

  let httpResponse: Response;
  try {
    httpResponse = await fetch(apiUrl);
  } catch (networkError) {
    throw new Error(
      'Network error — unable to reach the API server. Make sure the backend is running on port 3002.'
    );
  }

  if (!httpResponse.ok) {
    const errorBody = await httpResponse.json().catch(() => ({}));
    const serverMessage = errorBody.error?.message ?? errorBody.message;

    if (httpResponse.status === 404) {
      throw new Error(
        'Transaction not found on chain. It may not exist or hasn\'t been confirmed yet.'
      );
    }
    if (httpResponse.status === 429) {
      throw new Error('Rate limited by RPC — wait a moment and try again.');
    }
    if (httpResponse.status >= 500) {
      throw new Error(
        serverMessage ?? 'Server error — the RPC node may be unavailable. Try again.'
      );
    }

    throw new Error(serverMessage ?? `Analysis failed (HTTP ${httpResponse.status})`);
  }

  return httpResponse.json();
}

export function useTransactionAnalysis(
  transactionSignature: string | undefined,
  networkId: string = 'mainnet-beta'
) {
  return useQuery({
    queryKey: ['transactionAnalysis', transactionSignature, networkId],
    queryFn: () => fetchTransactionAnalysis(transactionSignature!, networkId),
    enabled: !!transactionSignature && transactionSignature.length >= 80,
  });
}
