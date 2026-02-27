/** Base error for all tx-parser errors */
export class TxParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TxParserError';
  }
}

/** Error parsing Bitcoin script structure */
export class ScriptParseError extends TxParserError {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptParseError';
  }
}

/** Error decoding/encoding CScriptNum values */
export class ScriptNumError extends TxParserError {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptNumError';
  }
}

/** Error parsing DD OP_RETURN metadata */
export class OpReturnParseError extends TxParserError {
  constructor(message: string) {
    super(message);
    this.name = 'OpReturnParseError';
  }
}
