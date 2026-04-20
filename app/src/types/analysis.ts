/**
 * Frontend type definitions for transaction analysis data.
 * Mirrors the server-side types in server/src/types/.
 */

export interface AccountMetaInfo {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
  label?: string;
}

export interface CPINode {
  programId: string;
  programName: string;
  instructionName: string;
  instructionData: Record<string, unknown>;
  accounts: AccountMetaInfo[];
  depth: number;
  children: CPINode[];
  success: boolean;
  error?: string;
  logMessages: string[];
  computeUnits: number;
}

export interface AccountSnapshot {
  lamports: number;
  dataHash: string;
  owner: string;
  dataSize: number;
}

export interface AccountDiffEntry {
  address: string;
  label: string;
  before: AccountSnapshot;
  after: AccountSnapshot;
  changes: string[];
}

export interface TransactionAnalysis {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  cpiTree: CPINode;
  allTrees: CPINode[];
  accountDiffs: AccountDiffEntry[];
  totalComputeUnits: number;
  innerInstructionsCount: number;
  instructionCount: number;
  errorExplanation?: string;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}
