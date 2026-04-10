/**
 * CPI tree node type definitions.
 *
 * A CPINode represents a single program invocation within a
 * Solana transaction. Nodes form a recursive tree: the top-level
 * instruction is root (depth 0), and each CPI call creates a
 * child node at depth + 1.
 *
 * @module types/cpi.node
 */

/**
 * Metadata about an account referenced by an instruction.
 */
export interface AccountMeta {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
  label?: string;
}

/**
 * Single node in the CPI call tree.
 * Each node = one program invocation.
 */
export interface CPINode {
  /** Program that was invoked */
  programId: string;

  /** Human-readable program name (e.g. "Token Program", "Jupiter v6") */
  programName: string;

  /** Decoded instruction name (e.g. "Transfer", "Swap") */
  instructionName: string;

  /** Decoded instruction data — shape depends on the IDL */
  instructionData: Record<string, unknown>;

  /** Accounts passed to this instruction */
  accounts: AccountMeta[];

  /** Depth in the CPI tree. 0 = top-level instruction */
  depth: number;

  /** Child CPI calls made by this instruction */
  children: CPINode[];

  /** Whether this instruction executed successfully */
  success: boolean;

  /** Error message if the instruction failed */
  error?: string;

  /** Raw log messages emitted during this instruction */
  logMessages: string[];

  /** Compute units consumed by this instruction (excluding children) */
  computeUnits: number;
}
