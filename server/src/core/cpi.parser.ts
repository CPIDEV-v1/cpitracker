/**
 * CPI Tree Parser
 *
 * Core parsing engine: takes a raw Solana transaction response
 * and builds a recursive CPINode tree. This is the heart of
 * CPITracker — every visualization and analysis feature depends
 * on the tree structure this module produces.
 *
 * Algorithm overview:
 *   1. Extract all account keys (static + lookup table resolved)
 *   2. Parse log messages into structured events
 *   3. Walk events with a stack to build the call tree
 *   4. Attach inner instruction data to each CPI node
 *   5. Resolve program names from the known-programs registry
 *
 * Supports both legacy and v0 (versioned) transactions.
 *
 * @module core/cpi.parser
 */

// --- deps ---
import {
  VersionedTransactionResponse,
  MessageCompiledInstruction,
  PublicKey,
} from '@solana/web3.js';

// --- local ---
import type { CPINode, AccountMeta } from '../types/cpi.node';
import { parseLogMessages, LogEvent } from './log.parser';
import { resolveProgramName } from './program.resolver';
import { ErrorCode, ServerError } from '../types/errors';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds a full CPI call tree from a Solana transaction response.
 *
 * Returns an array of CPINode trees — one per top-level instruction
 * in the transaction. Most transactions have 1-3 top-level instructions
 * (often the first is ComputeBudget::SetComputeUnitLimit).
 *
 * @param txResponse — raw VersionedTransactionResponse from RPC
 * @returns array of CPINode root nodes (one per top-level instruction)
 */
export function buildCpiTrees(
  txResponse: VersionedTransactionResponse
): CPINode[] {
  const { transaction, meta } = txResponse;

  if (!meta) {
    throw new ServerError(
      ErrorCode.PARSE_FAILED,
      'Transaction meta is null — transaction may not be confirmed yet',
      422
    );
  }

  // --- step 1: extract all account keys ---
  const allAccountKeys = extractAccountKeys(txResponse);

  // --- step 2: parse log messages ---
  const logMessages = meta.logMessages || [];
  const logEvents = parseLogMessages(logMessages);

  // --- step 3: get top-level and inner instructions ---
  const topLevelInstructions = extractTopLevelInstructions(transaction.message);
  const innerInstructionsMap = buildInnerInstructionsMap(meta.innerInstructions);

  // --- step 4: build tree from log events ---
  const trees = buildTreesFromEvents(
    logEvents,
    topLevelInstructions,
    innerInstructionsMap,
    allAccountKeys
  );

  return trees;
}

// ---------------------------------------------------------------------------
// Account key extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the complete ordered list of account keys from a transaction.
 *
 * For legacy transactions: just message.accountKeys.
 * For v0 transactions: staticAccountKeys + loadedAddresses (writable + readonly).
 *
 * The returned array matches the index space used by instruction.programIdIndex
 * and instruction.accounts[].
 */
function extractAccountKeys(txResponse: VersionedTransactionResponse): string[] {
  const { transaction, meta } = txResponse;
  const message = transaction.message;

  // staticAccountKeys is available on both legacy and v0 messages
  const staticKeys: PublicKey[] = message.staticAccountKeys;
  const keys: string[] = staticKeys.map((k) => k.toBase58());

  // v0 transactions have loaded addresses from lookup tables
  if (meta?.loadedAddresses) {
    const { writable, readonly } = meta.loadedAddresses;
    for (const addr of writable) {
      keys.push(addr.toBase58());
    }
    for (const addr of readonly) {
      keys.push(addr.toBase58());
    }
  }

  return keys;
}

// ---------------------------------------------------------------------------
// Instruction extraction
// ---------------------------------------------------------------------------

/**
 * Extracts top-level instructions from the transaction message.
 * Works with both legacy Message and MessageV0.
 */
function extractTopLevelInstructions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any
): MessageCompiledInstruction[] {
  // compiledInstructions is available on both Message and MessageV0 in recent web3.js
  if (message.compiledInstructions) {
    return message.compiledInstructions;
  }

  // fallback: legacy message.instructions (CompiledInstruction[])
  if (message.instructions) {
    return message.instructions.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ix: any) => ({
        programIdIndex: ix.programIdIndex,
        accountKeyIndexes: ix.accounts || [],
        data: ix.data ? Buffer.from(ix.data) : Buffer.alloc(0),
      })
    );
  }

  return [];
}

/**
 * Builds a map from top-level instruction index to its inner instructions.
 *
 * meta.innerInstructions is an array of { index, instructions[] } where
 * index refers to the position in message.instructions.
 */
function buildInnerInstructionsMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  innerInstructions: any[] | null | undefined
): Map<number, InnerInstruction[]> {
  const map = new Map<number, InnerInstruction[]>();
  if (!innerInstructions) return map;

  for (const group of innerInstructions) {
    const normalized: InnerInstruction[] = group.instructions.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ix: any) => ({
        programIdIndex: ix.programIdIndex,
        accounts: ix.accounts || ix.accountKeyIndexes || [],
        data: ix.data || '',
        stackHeight: ix.stackHeight ?? null,
      })
    );
    map.set(group.index, normalized);
  }

  return map;
}

/** Normalized inner instruction shape. */
interface InnerInstruction {
  programIdIndex: number;
  accounts: number[];
  data: string | Buffer;
  stackHeight: number | null;
}

// ---------------------------------------------------------------------------
// Tree builder — stack-based algorithm driven by log events
// ---------------------------------------------------------------------------

/**
 * Walks through parsed log events and builds the CPI tree.
 *
 * Uses a stack to track nesting. Each "invoke [N]" pushes a new
 * node, each "success"/"failed" annotates and pops. Log messages
 * and compute units are attached to the current (top-of-stack) node.
 *
 * Inner instruction data is matched to CPI nodes in execution order.
 */
function buildTreesFromEvents(
  events: LogEvent[],
  topLevelInstructions: MessageCompiledInstruction[],
  innerInstructionsMap: Map<number, InnerInstruction[]>,
  allAccountKeys: string[]
): CPINode[] {
  const trees: CPINode[] = [];
  const stack: CPINode[] = [];

  // tracks which top-level instruction we're currently processing
  let topLevelIndex = -1;

  // counter for inner instructions within the current top-level instruction
  let innerIndex = 0;

  for (const event of events) {
    switch (event.type) {
      // -----------------------------------------------------------------
      // Program invocation — push new node onto stack
      // -----------------------------------------------------------------
      case 'invoke': {
        if (event.depth === 1) {
          // --- top-level instruction ---
          topLevelIndex++;
          innerIndex = 0;

          const instruction = topLevelInstructions[topLevelIndex];
          const programId = instruction
            ? allAccountKeys[instruction.programIdIndex] || event.programId
            : event.programId;

          const node = createNode({
            programId,
            depth: 0,
            accounts: instruction
              ? buildAccountMetas(instruction.accountKeyIndexes, allAccountKeys)
              : [],
            instructionData: instruction
              ? encodeInstructionData(instruction.data)
              : {},
          });

          trees.push(node);
          stack.length = 0;
          stack.push(node);
        } else {
          // --- CPI call (depth > 1) ---
          const innerInstructions = innerInstructionsMap.get(topLevelIndex) || [];
          const innerIx = innerInstructions[innerIndex] || null;
          innerIndex++;

          const programId = innerIx
            ? allAccountKeys[innerIx.programIdIndex] || event.programId
            : event.programId;

          const node = createNode({
            programId,
            depth: event.depth - 1,
            accounts: innerIx
              ? buildAccountMetas(innerIx.accounts, allAccountKeys)
              : [],
            instructionData: innerIx
              ? encodeInstructionData(innerIx.data)
              : {},
          });

          // find parent: trim stack to depth - 1, then attach to top
          while (stack.length >= event.depth) {
            stack.pop();
          }

          const parent = stack[stack.length - 1];
          if (parent) {
            parent.children.push(node);
          }

          stack.push(node);
        }
        break;
      }

      // -----------------------------------------------------------------
      // Program return — annotate current node
      // -----------------------------------------------------------------
      case 'success': {
        const node = findNodeOnStack(stack, event.programId);
        if (node) {
          node.success = true;
        }
        popUntilProgram(stack, event.programId);
        break;
      }

      case 'failed': {
        const node = findNodeOnStack(stack, event.programId);
        if (node) {
          node.success = false;
          node.error = event.message;
        }
        popUntilProgram(stack, event.programId);
        break;
      }

      // -----------------------------------------------------------------
      // Compute units — attach to current node
      // -----------------------------------------------------------------
      case 'consumed': {
        const node = findNodeOnStack(stack, event.programId);
        if (node) {
          node.computeUnits = event.units;
        }
        break;
      }

      // -----------------------------------------------------------------
      // Log / data messages — attach to top of stack
      // -----------------------------------------------------------------
      case 'log': {
        const current = stack[stack.length - 1];
        if (current) {
          current.logMessages.push(event.message);
        }
        break;
      }

      case 'data': {
        const current = stack[stack.length - 1];
        if (current) {
          current.logMessages.push(`[data] ${event.base64}`);
        }
        break;
      }

      case 'return': {
        const current = stack[stack.length - 1];
        if (current) {
          current.logMessages.push(`[return] ${event.base64}`);
        }
        break;
      }

      case 'truncated': {
        const current = stack[stack.length - 1];
        if (current) {
          current.logMessages.push('[warning] log output truncated');
        }
        break;
      }
    }
  }

  return trees;
}

// ---------------------------------------------------------------------------
// Node construction helpers
// ---------------------------------------------------------------------------

interface CreateNodeParams {
  programId: string;
  depth: number;
  accounts: AccountMeta[];
  instructionData: Record<string, unknown>;
}

/**
 * Creates a new CPINode with defaults.
 * Program name is resolved from the known-programs registry.
 */
function createNode(params: CreateNodeParams): CPINode {
  const programInfo = resolveProgramName(params.programId);

  return {
    programId: params.programId,
    programName: programInfo.name,
    instructionName: 'unknown',
    instructionData: params.instructionData,
    accounts: params.accounts,
    depth: params.depth,
    children: [],
    success: true,
    logMessages: [],
    computeUnits: 0,
  };
}

/**
 * Builds AccountMeta array from account key indices.
 *
 * Note: isSigner/isWritable info is not available from inner
 * instructions, so we default to false. The caller can enrich
 * this later from the IDL or message header.
 */
function buildAccountMetas(
  accountIndexes: number[] | Uint8Array,
  allAccountKeys: string[]
): AccountMeta[] {
  const indexes = Array.from(accountIndexes);
  return indexes.map((idx) => ({
    pubkey: allAccountKeys[idx] || '11111111111111111111111111111111',
    isSigner: false,
    isWritable: false,
    label: undefined,
  }));
}

/**
 * Encodes raw instruction data for display.
 * Strings from RPC are base58-encoded; Buffers are converted to hex.
 */
function encodeInstructionData(
  data: string | Buffer | Uint8Array
): Record<string, unknown> {
  if (!data) return {};

  if (typeof data === 'string') {
    // inner instruction data arrives as base58 from RPC
    return { raw: data, encoding: 'base58' };
  } else if (Buffer.isBuffer(data)) {
    return { raw: data.toString('hex'), encoding: 'hex' };
  } else {
    return { raw: Buffer.from(data).toString('hex'), encoding: 'hex' };
  }
}

// ---------------------------------------------------------------------------
// Stack helpers
// ---------------------------------------------------------------------------

/**
 * Finds a node on the stack matching the given programId.
 * Searches from top (most recent) to bottom.
 */
function findNodeOnStack(stack: CPINode[], programId: string): CPINode | null {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].programId === programId) {
      return stack[i];
    }
  }
  return null;
}

/**
 * Pops nodes from the stack until we've removed the node matching
 * the given programId (inclusive). Used when processing success/failed
 * events to unwind the stack to the correct depth.
 */
function popUntilProgram(stack: CPINode[], programId: string): void {
  // safety: only pop if the programId exists on the stack, otherwise leave stack intact
  const exists = stack.some((n) => n.programId === programId);
  if (!exists) return;

  while (stack.length > 0) {
    const node = stack.pop();
    if (node && node.programId === programId) {
      break;
    }
  }
}
