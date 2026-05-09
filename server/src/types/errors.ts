/**
 * Error types for the CPITracker server.
 *
 * Every error that leaves the API boundary carries a structured
 * ErrorCode so clients can programmatically handle failures.
 *
 * @module types/errors
 */

export enum ErrorCode {
  // --- request validation ---
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  INVALID_PROGRAM_ID = 'INVALID_PROGRAM_ID',
  MISSING_PARAMETER = 'MISSING_PARAMETER',

  // --- RPC / data ---
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  RPC_ERROR = 'RPC_ERROR',
  RPC_TIMEOUT = 'RPC_TIMEOUT',

  // --- parsing ---
  PARSE_FAILED = 'PARSE_FAILED',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',

  // --- IDL ---
  IDL_NOT_FOUND = 'IDL_NOT_FOUND',
  IDL_DECODE_ERROR = 'IDL_DECODE_ERROR',

  // --- generic ---
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Structured server error with an HTTP status code and
 * machine-readable error code.
 */
export class ServerError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;

  constructor(code: ErrorCode, message: string, httpStatus: number = 500) {
    super(message);
    this.name = 'ServerError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
