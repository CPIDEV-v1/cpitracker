/**
 * IDL Registry
 *
 * Maintains a registry of known Anchor IDLs for program
 * instruction decoding. Sources:
 *   - Built-in: top Solana programs (System, Token, AToken, etc.)
 *   - User-uploaded: custom IDLs stored in memory
 *   - On-chain: fetched from the Anchor IDL account
 *
 * @module core/idl.registry
 */

/**
 * Looks up an IDL by program ID.
 *
 * Search order:
 *   1. Built-in IDLs (known-programs.json)
 *   2. User-uploaded IDLs (in-memory map)
 *   3. On-chain Anchor IDL account fetch
 *
 * @param _programId — base58-encoded program public key
 * @returns the IDL object, or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getIdl(_programId: string): Promise<any | null> {
  // placeholder — will implement in Phase 2
  return null;
}
