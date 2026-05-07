/**
 * IDL Registry
 *
 * Maintains a registry of known Anchor IDLs for program
 * instruction decoding. Sources:
 *   - Built-in: top Solana programs (System, Token, AToken, etc.)
 *   - User-uploaded: custom IDLs stored in memory
 *   - On-chain: fetched from the Anchor IDL account (Phase 2+)
 *
 * @module core/idl.registry
 */

// --- local ---
import { resolveProgramName } from './program.resolver';

// ---------------------------------------------------------------------------
// Built-in stub IDLs
// ---------------------------------------------------------------------------

/**
 * Minimal placeholder IDL shape used when we recognise the
 * program by ID (via known-programs.json) but don't yet have
 * a full Anchor IDL bundled. Callers can still display the
 * resolved name + colour from this object.
 *
 * Real Anchor IDLs replace this once Phase 2 ships.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StubIdl = {
  programId: string;
  name: string;
  shortName: string;
  source: 'known-programs';
  instructions: unknown[];
};

// in-memory map for user-uploaded IDLs (Phase 2 will hydrate this)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userUploadedIdls: Map<string, any> = new Map();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Looks up an IDL by program ID.
 *
 * Search order:
 *   1. User-uploaded IDLs (in-memory map)
 *   2. Built-in known-programs.json metadata (returned as a stub
 *      so the client at least sees a name/shortName)
 *   3. On-chain Anchor IDL account fetch — Phase 2+, not wired yet
 *
 * Returns null and logs a warning when nothing matches so callers
 * can render a clear "no IDL available" diagnostic instead of
 * silently failing.
 *
 * @param programId — base58-encoded program public key
 * @returns the IDL object, or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getIdl(programId: string): Promise<any | null> {
  // 1. user-uploaded
  const uploaded = userUploadedIdls.get(programId);
  if (uploaded) {
    return uploaded;
  }

  // 2. built-in known-programs metadata stub
  const knownInfo = resolveProgramName(programId);
  if (knownInfo.shortName !== 'Unknown') {
    const stub: StubIdl = {
      programId,
      name: knownInfo.name,
      shortName: knownInfo.shortName,
      source: 'known-programs',
      instructions: [],
    };
    return stub;
  }

  // 3. on-chain fetch — TODO Phase 2
  console.warn(`[idl.registry] no IDL available for ${programId}`);
  return null;
}
