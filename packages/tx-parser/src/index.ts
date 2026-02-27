// Detection
export { isDigiDollarTx, getDDTxType } from './detect.js';
export type { DDTxType } from './detect.js';

// Parsing
export { parseOpReturn } from './op-return.js';
export { classifyTransaction } from './classify.js';

// Safety guards
export { isDDToken, isDDCollateral, isDDMetadata, isStandard, isDDOutput, filterSafeOutputs } from './guards.js';

// Script utilities
export { decodeScriptNum, encodeScriptNum } from './script-num.js';
export { iterScript } from './script-iter.js';
export type { ScriptOp } from './script-iter.js';

// Hex utilities
export { hexToBytes, bytesToHex, dgbToSats } from './hex.js';

// Errors
export { TxParserError, ScriptParseError, ScriptNumError, OpReturnParseError } from './errors.js';

// All types
export * from './types/index.js';
