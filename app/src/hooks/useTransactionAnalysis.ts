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
    throw new Error('Invalid transaction signature format');
  }

  const queryString = networkId !== 'mainnet-beta' ? `?network=${networkId}` : '';
  const apiUrl = `/api/analyze/${encodeURIComponent(transactionSignature)}${queryString}`;

  const httpResponse = await fetch(apiUrl);

  if (!httpResponse.ok) {
    const errorBody = await httpResponse.json().catch(() => ({}));
    throw new Error(
      errorBody.error?.message ?? `Analysis failed (${httpResponse.status})`
    );
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
