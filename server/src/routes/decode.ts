/**
 * /api/decode routes
 *
 * Provides program IDL lookup, known program listing,
 * and instruction decoding.
 *
 * @module routes/decode
 */

// --- deps ---
import { Router } from 'express';

// --- local ---
import { resolveProgramName, getAllKnownPrograms } from '../core/program.resolver';
import { getIdl } from '../core/idl.registry';
import { ErrorCode, ServerError } from '../types/errors';

const decodeRouter = Router();

/**
 * GET /api/decode/:programId
 *
 * Returns the known IDL for a program. Checks built-in registry
 * first, then attempts to fetch the Anchor IDL from chain.
 *
 * @param programId — base58-encoded program public key
 */
decodeRouter.get('/:programId', async (req, res, next) => {
  try {
    const { programId } = req.params;

    if (!programId || programId.length < 32 || programId.length > 44) {
      throw new ServerError(
        ErrorCode.INVALID_PROGRAM_ID,
        `Invalid program ID: ${programId}`,
        400
      );
    }

    const programInfo = resolveProgramName(programId);
    const idl = await getIdl(programId);

    res.json({
      programId,
      name: programInfo.name,
      shortName: programInfo.shortName,
      color: programInfo.color,
      hasIdl: idl !== null,
      idl,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/known-programs
 *
 * Returns the list of programs with built-in support.
 */
decodeRouter.get('/', async (_req, res) => {
  const programs = getAllKnownPrograms();
  res.json({ programs, count: programs.length });
});

export { decodeRouter };
