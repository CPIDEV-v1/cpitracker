/**
 * Program Resolver
 *
 * Maps Solana program IDs to human-readable names and colors.
 * Loads the built-in known-programs.json registry at startup
 * and provides fast O(1) lookups.
 *
 * Programs not in the registry are labeled "Unknown Program"
 * with a fallback color. User-uploaded IDLs can extend the
 * registry at runtime.
 *
 * @module core/program.resolver
 */

// --- deps ---
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgramInfo {
  name: string;
  shortName: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const programRegistry: Map<string, ProgramInfo> = new Map();

const FALLBACK_INFO: ProgramInfo = {
  name: 'Unknown Program',
  shortName: 'Unknown',
  color: '#4b5563',
};

/**
 * Loads known-programs.json into the in-memory registry.
 * Called once at startup. Safe to call multiple times.
 */
function loadRegistry(): void {
  if (programRegistry.size > 0) return;

  try {
    const filePath = path.resolve(__dirname, '../data/known-programs.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, ProgramInfo>;

    for (const [programId, info] of Object.entries(data)) {
      programRegistry.set(programId, info);
    }

    console.log(`[resolver] loaded ${programRegistry.size} known programs`);
  } catch (err) {
    console.error('[resolver] failed to load known-programs.json:', err);
  }
}

// load on module init
loadRegistry();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves a program ID to its name and color.
 *
 * @param programId — base58-encoded program public key
 * @returns ProgramInfo with name, shortName, and color
 */
export function resolveProgramName(programId: string): ProgramInfo {
  return programRegistry.get(programId) || FALLBACK_INFO;
}

/**
 * Returns the full known-programs registry as an array.
 * Used by the /api/known-programs endpoint.
 */
export function getAllKnownPrograms(): Array<{ programId: string } & ProgramInfo> {
  const result: Array<{ programId: string } & ProgramInfo> = [];
  for (const [programId, info] of programRegistry) {
    result.push({ programId, ...info });
  }
  return result;
}

/**
 * Registers a program name at runtime (e.g. from a user-uploaded IDL).
 */
export function registerProgram(programId: string, info: ProgramInfo): void {
  programRegistry.set(programId, info);
  console.log(`[resolver] registered program: ${info.shortName} (${programId.slice(0, 8)}...)`);
}
