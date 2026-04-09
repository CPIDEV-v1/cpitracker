/**
 * /api/decode routes
 *
 * Provides program IDL lookup and instruction decoding.
 * Returns known IDLs from the built-in registry or fetches
 * Anchor IDLs from chain.
 *
 * @module routes/decode
 */

// --- deps ---
import { Router } from 'express';

// --- local ---
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

    // TODO: wire up idlRegistry.getIdl(programId)
    res.json({
      status: 'stub',
      programId,
      message: 'decode endpoint — IDL registry not yet wired',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/known-programs
 *
 * Returns the list of programs with built-in IDL support.
 */
decodeRouter.get('/', async (_req, res) => {
  // TODO: return actual known programs list from data/
  res.json({
    programs: [],
    message: 'known-programs endpoint — registry not yet loaded',
  });
});

export { decodeRouter };
