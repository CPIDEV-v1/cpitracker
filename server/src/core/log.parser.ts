/**
 * Solana Log Message Parser
 *
 * Parses raw log lines emitted during transaction execution
 * into structured events. These events drive the CPI tree builder.
 *
 * Solana log patterns:
 *   "Program <base58> invoke [<depth>]"
 *   "Program <base58> success"
 *   "Program <base58> failed: <message>"
 *   "Program <base58> consumed <N> of <M> compute units"
 *   "Program log: <message>"
 *   "Program data: <base64>"
 *   "Program return: <base58> <base64>"
 *   "Log truncated"
 *
 * @module core/log.parser
 */

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type LogEvent =
  | { type: 'invoke'; programId: string; depth: number }
  | { type: 'success'; programId: string }
  | { type: 'failed'; programId: string; message: string }
  | { type: 'consumed'; programId: string; units: number; limit: number }
  | { type: 'log'; message: string }
  | { type: 'data'; base64: string }
  | { type: 'return'; programId: string; base64: string }
  | { type: 'truncated' };

// ---------------------------------------------------------------------------
// Regex patterns — compiled once, reused across calls
// ---------------------------------------------------------------------------

const RE_INVOKE = /^Program (\w+) invoke \[(\d+)\]$/;
const RE_SUCCESS = /^Program (\w+) success$/;
const RE_FAILED = /^Program (\w+) failed: (.+)$/;
const RE_CONSUMED = /^Program (\w+) consumed (\d+) of (\d+) compute units$/;
const RE_LOG = /^Program log: (.+)$/;
const RE_DATA = /^Program data: (.+)$/;
const RE_RETURN = /^Program return: (\w+) (.+)$/;
const RE_TRUNCATED = /^Log truncated$/;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses an array of raw Solana log messages into structured events.
 *
 * Each log line maps to exactly one LogEvent. Lines that don't match
 * any known pattern are silently skipped (Solana occasionally emits
 * non-standard messages from programs).
 *
 * @param logMessages — raw log lines from transaction meta
 * @returns ordered array of LogEvent
 */
export function parseLogMessages(logMessages: string[]): LogEvent[] {
  const events: LogEvent[] = [];

  for (const line of logMessages) {
    const event = parseSingleLine(line);
    if (event !== null) {
      events.push(event);
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

/**
 * Attempts to parse a single log line. Returns null if the line
 * doesn't match any known pattern.
 */
function parseSingleLine(line: string): LogEvent | null {
  let match: RegExpMatchArray | null;

  // --- invoke ---
  match = line.match(RE_INVOKE);
  if (match) {
    return {
      type: 'invoke',
      programId: match[1],
      depth: parseInt(match[2], 10),
    };
  }

  // --- success ---
  match = line.match(RE_SUCCESS);
  if (match) {
    return { type: 'success', programId: match[1] };
  }

  // --- failed ---
  match = line.match(RE_FAILED);
  if (match) {
    return { type: 'failed', programId: match[1], message: match[2] };
  }

  // --- consumed ---
  match = line.match(RE_CONSUMED);
  if (match) {
    return {
      type: 'consumed',
      programId: match[1],
      units: parseInt(match[2], 10),
      limit: parseInt(match[3], 10),
    };
  }

  // --- program log ---
  match = line.match(RE_LOG);
  if (match) {
    return { type: 'log', message: match[1] };
  }

  // --- program data (anchor events, etc.) ---
  match = line.match(RE_DATA);
  if (match) {
    return { type: 'data', base64: match[1] };
  }

  // --- return data ---
  match = line.match(RE_RETURN);
  if (match) {
    return { type: 'return', programId: match[1], base64: match[2] };
  }

  // --- truncated ---
  if (RE_TRUNCATED.test(line)) {
    return { type: 'truncated' };
  }

  // unknown line — skip silently
  return null;
}
