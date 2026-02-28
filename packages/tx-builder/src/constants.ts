/**
 * NUMS (Nothing Up My Sleeve) x-only public key for collateral internal key.
 * Forces script-path spend only — no key-path spend possible.
 * Derived from: lift_x(SHA256(serialize_uncompressed(G)))
 * Source: scripts.h:35-40
 */
export const NUMS_POINT = new Uint8Array([
  0x50, 0x92, 0x9b, 0x74, 0xc1, 0xa0, 0x49, 0x54,
  0xb7, 0x8b, 0x4b, 0x60, 0x35, 0xe9, 0x7a, 0x5e,
  0x07, 0x8a, 0x5a, 0x0f, 0x28, 0xec, 0x96, 0xd5,
  0x47, 0xbf, 0xee, 0x9a, 0xce, 0x80, 0x3a, 0xc0,
]);

/** Tapscript leaf version (BIP-342) */
export const TAPSCRIPT_LEAF_VERSION = 0xc0;

// --- Lock tier table (consensus/digidollar.h:50-61) ---

export interface LockTierEntry {
  blocks: number;
  ratio: number; // percentage, e.g. 500 = 500%
}

/** Lock tier table: tier index → { blocks, ratio } */
export const LOCK_TIERS: readonly LockTierEntry[] = [
  { blocks: 240,        ratio: 1000 }, // Tier 0: 1 hour (testing/onboarding)
  { blocks: 172_800,    ratio: 500 },  // Tier 1: 30 days
  { blocks: 518_400,    ratio: 400 },  // Tier 2: 90 days
  { blocks: 1_036_800,  ratio: 350 },  // Tier 3: 180 days
  { blocks: 2_102_400,  ratio: 300 },  // Tier 4: 1 year
  { blocks: 4_204_800,  ratio: 275 },  // Tier 5: 2 years
  { blocks: 6_307_200,  ratio: 250 },  // Tier 6: 3 years
  { blocks: 10_512_000, ratio: 225 },  // Tier 7: 5 years
  { blocks: 14_716_800, ratio: 212 },  // Tier 8: 7 years
  { blocks: 21_024_000, ratio: 200 },  // Tier 9: 10 years
] as const;

export const BLOCKS_PER_DAY = 5760; // 24 * 60 * 4 (15s blocks)

// --- Fee constants (txbuilder.cpp:26-31) ---

/** Minimum change output in sats */
export const DUST_THRESHOLD = 1000n;

/** Minimum fee rate in sat/vB (100,000 sat/kB = 100 sat/vB) */
export const MIN_FEE_RATE = 100n;

/** Maximum fee rate in sat/vB (100,000,000 sat/kB = 100,000 sat/vB) */
export const MAX_FEE_RATE = 100_000n;

/** Minimum DD transaction fee in sats (0.1 DGB) */
export const MIN_DD_FEE = 10_000_000n;

/** Minimum redeem fee in sats */
export const MIN_REDEEM_FEE = 50_000n;

/** Estimated witness bytes per P2TR script-path input */
export const WITNESS_PER_INPUT = 110;

/** Safety margin multiplier for fee estimation (35%) */
export const FEE_SAFETY_MARGIN = 1.35;

/** Maximum inputs per transaction */
export const MAX_TX_INPUTS = 400;

/** Maximum DGB in sats (21 billion DGB * 10^8) */
export const MAX_MONEY = 2_100_000_000_000_000_000n;

/** 1 DGB = 100,000,000 sats */
export const COIN = 100_000_000n;

// --- DD transaction versions ---

/** nVersion for DD mint transactions */
export const DD_VERSION_MINT = 0x01000770;

/** nVersion for DD transfer transactions */
export const DD_VERSION_TRANSFER = 0x02000770;

/** nVersion for DD redeem transactions */
export const DD_VERSION_REDEEM = 0x03000770;

// --- DD-specific opcodes (script.h:209-213) ---

export const OP_CHECKLOCKTIMEVERIFY = 0xb1;
export const OP_DROP = 0x75;
export const OP_CHECKSIG = 0xac;
export const OP_LESSTHAN = 0x9f;
export const OP_VERIFY = 0x69;
export const OP_DIGIDOLLAR = 0xbb;
export const OP_DDVERIFY = 0xbc;
export const OP_CHECKCOLLATERAL = 0xbe;

// --- Standard opcodes ---

export const OP_0 = 0x00;
export const OP_1 = 0x51;
export const OP_RETURN = 0x6a;
export const OP_PUSHDATA1 = 0x4c;
export const OP_PUSHDATA2 = 0x4d;
export const OP_PUSHDATA4 = 0x4e;

// --- nSequence values ---

/** Enables CLTV (must be < 0xFFFFFFFF) */
export const SEQUENCE_CLTV_ENABLED = 0xfffffffe;

/** Standard sequence (no CLTV) */
export const SEQUENCE_FINAL = 0xffffffff;
