# DigiDollar SDK

Typed TypeScript SDK for the [DigiDollar](https://github.com/DigiByte-Core/digibyte/tree/feature/digidollar-v1) stablecoin protocol on DigiByte.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@digidollar/rpc-client`](packages/rpc-client) | Typed RPC wrapper for all 35 DigiDollar + blockchain methods | Phase 1 |
| [`@digidollar/tx-parser`](packages/tx-parser) | Pure transaction parser and UTXO classifier | Phase 2 |
| [`@digidollar/tx-builder`](packages/tx-builder) | Build unsigned DD transactions without a node | Phase 3 |
| [`@digidollar/core`](packages/core) | High-level SDK — mint, transfer, redeem with automatic signing | Phase 4 |

## Quick Start

### Core SDK — the easiest way to use DigiDollar

```bash
npm install @digidollar/core
```

```typescript
import { DigiDollar, BIP86Signer } from '@digidollar/core';

// Create a signer from a mnemonic (or generate a new one)
const signer = BIP86Signer.fromMnemonic('abandon abandon abandon ...', 'testnet');
// Or: const { signer, mnemonic } = BIP86Signer.generate('testnet');

// Connect to a DigiByte node
const dd = new DigiDollar({
  network: 'testnet',
  rpc: { port: 14024, username: 'rpcuser', password: 'rpcpassword' },
  signer,
});

// Mint DigiDollars — locks DGB as collateral
const mint = await dd.mint({ ddAmountCents: 10_000n, lockTier: 1 });
console.log(`Minted $100 DD | txid: ${mint.txid}`);
console.log(`Collateral locked: ${mint.collateralSats} sats`);
console.log(`Unlocks at block: ${mint.unlockHeight}`);

// Transfer DigiDollars
const transfer = await dd.transfer({
  recipients: [
    { toAddress: 'dgbt1p...', ddAmountCents: 5_000n },
  ],
});
console.log(`Sent $50 DD | txid: ${transfer.txid}`);

// Redeem — burn DD, unlock DGB collateral
const redeem = await dd.redeem({ positionId: mint.txid });
console.log(`Redeemed | DGB returned: ${redeem.dgbReturnedSats} sats`);

// Read-only queries (no signer needed)
const price = await dd.getOraclePrice();
const stats = await dd.getStats();
const positions = await dd.getPositions();
const utxos = await dd.getUTXOs();
const height = await dd.getBlockHeight();
```

### RPC Client — talk to a DigiByte node

```bash
npm install @digidollar/rpc-client
```

```typescript
import { DigiDollarRPC } from '@digidollar/rpc-client';

const dd = new DigiDollarRPC({
  port: 14022,
  username: 'rpcuser',
  password: 'rpcpassword',
  wallet: 'dd_wallet',    // optional, for wallet-context RPCs
});

// Oracle
const price = await dd.getOraclePrice();
console.log(`DGB/USD: $${price.price_usd}`);

// System stats
const stats = await dd.getStats();
console.log(`Health: ${stats.health_percentage}% | Supply: ${stats.total_dd_supply} cents`);

// Mint DigiDollars (locks DGB collateral)
const mint = await dd.mint({ ddAmountCents: 10000, lockTier: 4 });
console.log(`Minted $100 DD | txid: ${mint.txid}`);

// Send DigiDollars
const send = await dd.send({ address: 'DDrecipient...', amountCents: 5000 });

// Check balance
const balance = await dd.getBalance();
console.log(`Balance: ${balance.total} cents`);

// Redeem (burn DD, unlock DGB collateral)
const redeem = await dd.redeem({ positionId: mint.txid, ddAmountCents: 10000 });
```

### TX Parser — classify transactions without a node

```bash
npm install @digidollar/tx-parser
```

```typescript
import {
  classifyTransaction,
  filterSafeOutputs,
  isDigiDollarTx,
  parseOpReturn,
} from '@digidollar/tx-parser';

// Feed it any decoded transaction (from RPC, block explorer API, etc.)
const rawTx = await fetchTransaction('abc123...');

// Detect DD transactions by version marker
if (isDigiDollarTx(rawTx.version)) {
  console.log('This is a DigiDollar transaction');
}

// Classify every output
const classified = classifyTransaction(rawTx);

console.log(`Type: ${classified.txType}`);           // 'mint' | 'transfer' | 'redeem'
console.log(`Tokens: ${classified.tokens.length}`);   // zero-value P2TR (DD ownership)
console.log(`Collateral: ${classified.collateral.length}`); // locked DGB
console.log(`Safe to spend: ${classified.standard.length}`); // regular DGB change

// SAFETY: filter outputs for wallet coin selection
const safeOutputs = filterSafeOutputs(classified.outputs);
// safeOutputs contains ONLY standard DGB — no DD tokens, collateral, or metadata

// Parse OP_RETURN metadata directly
const opReturn = parseOpReturn(rawTx.vout[2].scriptPubKey.hex);
if (opReturn?.txType === 'mint') {
  console.log(`Minted ${opReturn.ddAmountCents} cents, locked until block ${opReturn.lockHeight}`);
}
```

### TX Builder — construct transactions without a node

```bash
npm install @digidollar/tx-builder
```

```typescript
import {
  MintBuilder,
  TransferBuilder,
  RedeemBuilder,
  calculateCollateral,
  getCollateralRatio,
  lockTierToBlocks,
} from '@digidollar/tx-builder';

// Build a mint transaction
const mintResult = MintBuilder.build({
  ddAmountCents: 10_000n,           // $100 DD
  lockTier: 1,                       // 30 days, 500% collateral
  ownerPubKey: myXOnlyPubKey,        // 32-byte x-only key
  oraclePriceMicroUsd: 6_310n,      // $0.00631 per DGB
  currentHeight: 60_000,
  utxos: myAvailableUtxos,           // DGB UTXOs for collateral + fees
  feeRate: 100n,                     // 100 sat/vB
  changeDest: myChangeScriptPubKey,  // hex scriptPubKey for DGB change
});

console.log(`Unsigned tx: ${mintResult.tx.length} bytes`);
console.log(`Txid: ${mintResult.txid}`);
console.log(`Fee: ${mintResult.fee} sats`);
// Sign externally, then broadcast

// Build a transfer transaction
const transferResult = TransferBuilder.build({
  recipients: [
    { recipientPubKey: aliceKey, ddAmountCents: 3000n },
    { recipientPubKey: bobKey, ddAmountCents: 2000n },
  ],
  ddUtxos: myDDTokenUtxos,           // DD token UTXOs to spend
  feeUtxos: myFeeUtxos,              // DGB UTXOs for fees
  spenderPubKey: myXOnlyPubKey,
  feeRate: 100n,
  changeDest: myChangeScriptPubKey,
});

// Build a redeem transaction (unlock collateral)
const redeemResult = RedeemBuilder.build({
  collateralUtxo: myCollateralUtxo,
  ddToRedeemCents: 10_000n,
  ddUtxos: myDDTokenUtxos,
  feeUtxos: myFeeUtxos,
  ownerPubKey: myXOnlyPubKey,
  currentHeight: 300_000,
  unlockHeight: 232_800,              // must be <= currentHeight
  collateralAmount: 7_924_009_508_716n,
  feeRate: 100n,
  collateralDest: myCollateralScriptPubKey,
  changeDest: myChangeScriptPubKey,
});

// Calculate collateral requirements
const ratio = getCollateralRatio(1);  // 500 (500% for tier 1)
const blocks = lockTierToBlocks(1);   // 172,800 (30 days)
const collateralSats = calculateCollateral(10_000n, 6_310n, ratio);
// 7,924,009,508,716 sats (~79,240 DGB)
```

## Features

### core
- **High-level facade** — `dd.mint()`, `dd.transfer()`, `dd.redeem()` handle everything
- **Pluggable Backend** — default `RpcBackend` wraps `DigiDollarRPC`, swap in Electrum/Blockbook later
- **Pluggable Signer** — default `BIP86Signer` (BIP-86 Taproot HD), swap in hardware wallets or KMS
- **BIP-86 HD derivation** — `m/86'/20'/0'` (mainnet), `m/86'/1'/0'` (testnet), mnemonic support
- **DigiByte bech32m** — encode/decode P2TR addresses with `dgb`/`dgbt`/`dgbrt` HRPs
- **UTXO Manager** — queries, classifies, and partitions UTXOs (standard/ddTokens/ddCollateral)
- **Position Tracker** — enriches positions with unlock timing, health status, redeemability
- **Oracle Wrapper** — staleness checks, `requireFreshPrice()` guard, unit conversions
- **BIP-341 sighash** — full Taproot sighash computation for key-path and script-path spends
- **Witness construction** — key-path `[sig]` and script-path `[sig, leafScript, controlBlock]`
- **Full pipelines** — each tx type: oracle check → UTXO query → build → sighash → sign → broadcast
- **77 unit tests** — covering all modules

### rpc-client
- **35 typed RPC methods** — oracle, balance, transaction, position, wallet, system, blockchain
- **Zero runtime dependencies** — native `fetch` (Node 20+)
- **Dual ESM/CJS** — works with both module systems
- **Typed error hierarchy** — `OraclePriceUnavailableError`, `InsufficientFundsError`, etc.
- **Cookie auth support** — works with DigiByte Core's `.cookie` file
- **Batch requests** — send multiple RPC calls in a single HTTP request
- **Raw escape hatch** — `dd.call('anyMethod', [params])` for unlisted methods

### tx-parser
- **Pure parsing** — no RPC connection, no network access, no dependencies
- **UTXO classification** — `standard`, `dd_token`, `dd_collateral`, `dd_metadata`
- **Safety layer** — `filterSafeOutputs()` prevents wallets from spending DD outputs
- **Protocol-accurate** — CScriptNum and GetScriptOp ported directly from DigiByte C++
- **Type-aware OP_RETURN parsing** — correctly handles mint, transfer, and redeem formats
- **Dual ESM/CJS** — same build pattern as rpc-client
- **125 unit tests** — covering all modules including round-trip CScriptNum verification

### tx-builder
- **Build unsigned transactions** — mint, transfer, and redeem without a DigiByte node
- **Taproot MAST construction** — NUMS internal key, Normal + ERR leaf scripts, BIP-341 key tweaking
- **OP_RETURN encoding** — round-trip compatible with tx-parser's `parseOpReturn()`
- **Collateral calculation** — bigint math matching C++ `__int128` formula exactly
- **Greedy coin selection** — largest-first with `MAX_TX_INPUTS` safety limit
- **Fee estimation** — vsize-based with 35% safety margin
- **Optional Schnorr signing** — BIP-340 via `@noble/curves`
- **2 runtime deps** — `@noble/curves` + `@noble/hashes` (audited pure-JS crypto)
- **120 unit tests** — including cross-package round-trip verification

## core API

### DigiDollar Facade

```typescript
const dd = new DigiDollar(config: DigiDollarConfig);

// Transactions (require Signer)
dd.mint(req: MintRequest): Promise<MintResult>
dd.transfer(req: TransferRequest): Promise<TransferResult>
dd.redeem(req: RedeemRequest): Promise<RedeemResult>

// Read-only
dd.getOraclePrice(): Promise<OracleSnapshot>
dd.getBalance(address?): Promise<DDBalance>
dd.getPositions(activeOnly?): Promise<EnrichedPosition[]>
dd.getPosition(positionId): Promise<EnrichedPosition | null>
dd.getStats(): Promise<DDStats>
dd.getReceiveAddress(): Promise<string>
dd.getBlockHeight(): Promise<number>
dd.getUTXOs(): Promise<ClassifiedUTXOSet>
dd.estimateCollateral(ddAmountCents, lockTier): Promise<CollateralEstimate>
```

### BIP-86 Signer

```typescript
// From existing mnemonic
const signer = BIP86Signer.fromMnemonic(mnemonic, network);

// Generate new
const { signer, mnemonic } = BIP86Signer.generate(network);

// Derive addresses
const { address, path } = signer.deriveNextAddress();  // sequential
const xpub = signer.getAccountXpub();                  // watch-only export
```

### Address Encoding

```typescript
import { encodeBech32m, decodeBech32m } from '@digidollar/core';

const addr = encodeBech32m(xOnlyPubKey, 'testnet');  // → dgbt1p...
const { program, network } = decodeBech32m(addr);    // → 32-byte key + 'testnet'
```

### Pluggable Backend

```typescript
import { DigiDollar, RpcBackend } from '@digidollar/core';

// Default: RPC backend (from config)
const dd = new DigiDollar({ network: 'testnet', rpc: { port: 14024, ... } });

// Custom: pass your own Backend implementation
const dd = new DigiDollar({ network: 'testnet', backend: myElectrumBackend });
```

### Pluggable Signer

```typescript
import type { Signer, SigningContext } from '@digidollar/core';

// Implement for hardware wallets, KMS, etc.
class LedgerSigner implements Signer {
  async getPublicKey(path?) { /* talk to Ledger */ }
  async sign(ctx: SigningContext) { /* sign on device */ }
  async getScriptPubKey(path?) { /* derive P2TR script */ }
  async getAddress(path?) { /* derive bech32m address */ }
}

const dd = new DigiDollar({
  network: 'mainnet',
  rpc: { port: 14022, ... },
  signer: new LedgerSigner(),
});
```

## tx-builder API

### Builders

```typescript
MintBuilder.build(params: MintParams): BuilderResult
TransferBuilder.build(params: TransferParams): BuilderResult
RedeemBuilder.build(params: RedeemParams): BuilderResult
```

### Taproot

```typescript
buildCollateralMAST(ownerPubKey, lockHeight): CollateralSpendData
buildTokenP2TR(ownerPubKey): Uint8Array           // P2TR scriptPubKey
buildNormalLeaf(ownerPubKey, lockHeight): Uint8Array
buildERRLeaf(ownerPubKey, lockHeight): Uint8Array
tweakPublicKey(xOnlyKey, merkleRoot?): { outputKey, parity }
```

### OP_RETURN Encoding

```typescript
encodeMintOpReturn(amount, lockHeight, lockTier, ownerPubKey): Uint8Array
encodeTransferOpReturn(amounts[]): Uint8Array
encodeRedeemOpReturn(amount): Uint8Array
```

### Collateral

```typescript
calculateCollateral(ddCents, oracleMicroUsd, ratioPercent): bigint
getCollateralRatio(lockTier): number     // e.g. 500 for 500%
lockTierToBlocks(tier): number           // e.g. 172,800 for tier 1
```

### Transaction Serialization

```typescript
serializeTransaction(tx): Uint8Array     // full SegWit format
serializeForTxid(tx): Uint8Array         // without witness (for txid)
computeTxid(tx): string                  // double-SHA256, reversed hex
```

### Signing (optional)

```typescript
signSchnorr(txHash, privateKey): Uint8Array   // 64-byte BIP-340 signature
verifySchnorr(signature, txHash, pubKey): boolean
```

## tx-parser API

### Detection

```typescript
isDigiDollarTx(version: number | { version: number }): boolean
getDDTxType(version: number): 'mint' | 'transfer' | 'redeem' | null
```

### Parsing

```typescript
parseOpReturn(scriptHex: string | Uint8Array): DDOpReturnData | null
classifyTransaction(tx: DecodedTx): ClassifiedTransaction
```

### Safety Guards

```typescript
isDDToken(output): boolean        // zero-value P2TR (DD ownership)
isDDCollateral(output): boolean   // locked DGB backing DigiDollars
isDDMetadata(output): boolean     // OP_RETURN protocol data
isStandard(output): boolean       // regular DGB, safe to spend
isDDOutput(output): boolean       // any DD protocol output
filterSafeOutputs(outputs): ClassifiedOutput[]  // KEY FUNCTION for wallets
```

### Script Utilities

```typescript
decodeScriptNum(bytes: Uint8Array): bigint   // CScriptNum → bigint
encodeScriptNum(value: bigint): Uint8Array   // bigint → CScriptNum
iterScript(script: Uint8Array): Generator<ScriptOp>  // opcode iterator
```

### Hex Utilities

```typescript
hexToBytes(hex: string): Uint8Array
bytesToHex(bytes: Uint8Array): string
dgbToSats(dgb: number): bigint    // 1.5 DGB → 150000000n
```

### Output Classification

| Condition | Classification | Safe to Spend? |
|-----------|---------------|----------------|
| Any output in non-DD tx | `standard` | Yes |
| Non-P2TR with value > 0 in DD tx | `standard` | Yes |
| OP_RETURN in DD tx | `dd_metadata` | No |
| P2TR + value = 0 in DD tx | `dd_token` | No |
| P2TR + value > 0 in DD tx | `dd_collateral` | No |

## RPC Methods

### Oracle (14 methods)
| Method | Description |
|--------|-------------|
| `getOraclePrice()` | Current consensus DGB/USD price |
| `getAllOraclePrices(blocks?)` | All oracle prices for recent blocks |
| `getOracles(activeOnly?)` | Info about registered oracles |
| `listOracle()` | Local oracle status |
| `startOracle(id, key?)` | Start oracle node (wallet) |
| `stopOracle(id)` | Stop oracle node |
| `getOraclePubkey(id)` | Oracle public key |
| `createOracleKey(id)` | Generate oracle keypair (wallet) |
| `sendOraclePrice(price, id?)` | Send price (testnet) |
| `submitOraclePrice(id, price)` | Submit price directly (regtest) |
| `setMockOraclePrice(price)` | Set mock price (regtest) |
| `getMockOraclePrice()` | Get mock price (regtest) |
| `enableMockOracle(enable)` | Toggle mock oracle (regtest) |
| `simulatePriceVolatility(pct)` | Simulate volatility (regtest) |

### Transaction (4 methods)
| Method | Description |
|--------|-------------|
| `mint(params)` | Mint DD by locking DGB collateral |
| `send(params)` | Send DD to another address |
| `redeem(params)` | Redeem DD to unlock collateral |
| `listTransactions(params?)` | List DD transaction history |

### Position (4 methods)
| Method | Description |
|--------|-------------|
| `listPositions(params?)` | List collateral positions |
| `getRedemptionInfo(id, amount?)` | Redemption info for a position |
| `calculateCollateral(params)` | Calculate collateral by lock days |
| `estimateCollateral(params)` | Estimate collateral by lock tier |

### Blockchain (4 methods)
| Method | Description |
|--------|-------------|
| `listUnspent(minconf?, maxconf?, addresses?)` | List unspent outputs |
| `getRawTransaction(txid, verbose?)` | Get raw/decoded transaction |
| `sendRawTransaction(hex)` | Broadcast signed transaction |
| `getBlockCount()` | Current blockchain height |

### System (4 methods)
| Method | Description |
|--------|-------------|
| `getStats()` | System health, supply, collateral |
| `getDcaMultiplier(health?)` | DCA multiplier |
| `getDeploymentInfo()` | BIP9 activation status |
| `getProtectionStatus()` | DCA/ERR/volatility protection |

### Wallet (4 methods)
| Method | Description |
|--------|-------------|
| `getAddress(label?)` | Generate new DD address (wallet) |
| `validateAddress(addr)` | Validate DD address format |
| `listAddresses(params?)` | List DD addresses |
| `importAddress(params)` | Import address for watching |

### Balance (1 method)
| Method | Description |
|--------|-------------|
| `getBalance(params?)` | DD balance (wallet) |

## Authentication

```typescript
// Basic auth (username/password)
const dd = new DigiDollarRPC({
  port: 14022,
  username: 'rpcuser',
  password: 'rpcpassword',
});

// Cookie auth (reads .cookie file from datadir)
const dd = new DigiDollarRPC({
  port: 14022,
  cookiePath: '/home/user/.digibyte/.cookie',
});
```

## Error Handling

All RPC errors are mapped to typed exceptions:

```typescript
import {
  DigiDollarError,          // base class
  ConnectionError,          // can't reach node
  TimeoutError,             // request timed out
  AuthenticationError,      // bad credentials (401)
  RPCError,                 // node returned error
  DigiDollarNotActiveError, // protocol not activated
  InvalidParameterError,    // bad parameter (code -8)
  InvalidAddressError,      // bad address (code -5)
  InsufficientFundsError,   // not enough DGB (code -6)
  WalletLockedError,        // wallet needs unlock (code -13)
  WalletNotFoundError,      // wallet not loaded (code -18)
  OraclePriceUnavailableError, // no oracle consensus
} from '@digidollar/rpc-client';

try {
  await dd.mint({ ddAmountCents: 10000, lockTier: 4 });
} catch (err) {
  if (err instanceof InsufficientFundsError) {
    console.log('Need more DGB collateral');
  } else if (err instanceof OraclePriceUnavailableError) {
    console.log('Oracle consensus not available');
  }
}
```

Core SDK errors:

```typescript
import {
  CoreError,             // base class
  NoSignerError,         // no signer configured for tx operations
  StalePriceError,       // oracle price stale or unavailable
  InsufficientFundsError,// not enough DGB UTXOs
  InsufficientDDError,   // not enough DD token UTXOs
  PositionError,         // position not found or not redeemable
  AddressError,          // invalid bech32m address
  BackendError,          // backend communication failure
} from '@digidollar/core';
```

TX Builder errors:

```typescript
import {
  TxBuilderError,              // base class
  InvalidParamsError,          // bad parameters
  InsufficientCollateralError, // not enough DGB for collateral
  InsufficientFeeError,        // not enough DGB for fees
  InsufficientDDError,         // not enough DD tokens
  CoinSelectionError,          // coin selection failed
} from '@digidollar/tx-builder';
```

## Lock Tiers

| Tier | Lock Period | Collateral Ratio |
|------|-------------|------------------|
| 0 | 1 hour | 1000% |
| 1 | 30 days | 500% |
| 2 | 90 days | 400% |
| 3 | 180 days | 350% |
| 4 | 1 year | 300% |
| 5 | 2 years | 275% |
| 6 | 3 years | 250% |
| 7 | 5 years | 225% |
| 8 | 7 years | 212% |
| 9 | 10 years | 200% |

## Protocol Constants

```typescript
import { PROTOCOL, LOCK_TIERS } from '@digidollar/rpc-client';

PROTOCOL.MIN_MINT_AMOUNT   // 10,000 cents ($100 minimum)
PROTOCOL.MAX_MINT_AMOUNT   // 10,000,000 cents ($100k maximum)
PROTOCOL.ORACLE_THRESHOLD  // 8-of-15 consensus
PROTOCOL.PRICE_VALID_BLOCKS // 20 blocks (5 minutes)

LOCK_TIERS[4] // { days: 365, blocks: 2_102_400, ratio: 300 }
```

```typescript
import {
  LOCK_TIERS, NUMS_POINT, COIN, MAX_MONEY,
  DD_VERSION_MINT, DD_VERSION_TRANSFER, DD_VERSION_REDEEM,
  DUST_THRESHOLD, MIN_DD_FEE, MIN_REDEEM_FEE,
} from '@digidollar/tx-builder';

LOCK_TIERS[1]  // { blocks: 172_800, ratio: 500 }
COIN           // 100_000_000n (sats per DGB)
DUST_THRESHOLD // 1000n sats
```

## Requirements

- Node.js 20+ (native `fetch` for rpc-client)
- DigiByte Core with DigiDollar enabled (RC22+) for rpc-client
- tx-parser has no runtime requirements — pure data parsing
- tx-builder requires `@noble/curves` + `@noble/hashes` (audited pure-JS crypto)
- core adds `@scure/bip32` + `@scure/bip39` + `@scure/base` (audited pure-JS crypto)

## Roadmap

1. **RPC Client** — typed RPC wrapper (35 methods)
2. **TX Parser** — detect DD transactions, classify UTXOs (125 tests)
3. **TX Builder** — construct DD transactions without Core RPC (120 tests)
4. **Core SDK** — full pipeline with signing, UTXO management, position tracking (77 tests)

## License

MIT
