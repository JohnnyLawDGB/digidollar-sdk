/** DigiDollar version marker in lower 16 bits of nVersion */
export const DD_MARKER = 0x0770;

/** Version field masks */
export const DD_VERSION_MASK = 0x0000FFFF;
export const DD_TYPE_MASK = 0xFF000000;
export const DD_FLAGS_MASK = 0x00FF0000;

/** Transaction types */
export const DD_TX_MINT = 1;
export const DD_TX_TRANSFER = 2;
export const DD_TX_REDEEM = 3;

/** Script opcodes */
export const OP_0 = 0x00;
export const OP_PUSHDATA1 = 0x4c;
export const OP_PUSHDATA2 = 0x4d;
export const OP_PUSHDATA4 = 0x4e;
export const OP_RETURN = 0x6a;
export const OP_1 = 0x51;

/** P2TR script length: OP_1 (1 byte) + push-32 (1 byte) + 32-byte x-only pubkey */
export const P2TR_SCRIPT_LENGTH = 34;

/** P2TR push byte (0x20 = push exactly 32 bytes) */
export const P2TR_PUSH_32 = 0x20;

/** DD OP_RETURN marker bytes: ASCII "DD" */
export const DD_OP_RETURN_MARKER_0 = 0x44; // 'D'
export const DD_OP_RETURN_MARKER_1 = 0x44; // 'D'
