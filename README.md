# DigiDollar SDK

Typed TypeScript SDK for the [DigiDollar](https://github.com/DigiByte-Core/digibyte/tree/feature/digidollar-v1) stablecoin protocol on DigiByte.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@digidollar/rpc-client`](packages/rpc-client) | Typed RPC wrapper for all 31 DigiDollar methods | Phase 1 ✅ |
| [`@digidollar/tx-parser`](packages/tx-parser) | Pure transaction parser and UTXO classifier | Phase 2 ✅ |

## Quick Start

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

## Features

### rpc-client
- **31 typed RPC methods** — oracle, balance, transaction, position, wallet, system
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

## Requirements

- Node.js 20+ (native `fetch` for rpc-client)
- DigiByte Core with DigiDollar enabled (RC22+) for rpc-client
- tx-parser has no runtime requirements — pure data parsing

## Roadmap

1. **RPC Client** — typed RPC wrapper ✅
2. **TX Parser** — detect DD transactions, classify UTXOs ✅
3. **TX Builder** — construct DD transactions without Core RPC
4. **Full SDK** — oracle consensus, UTXO tracking, position lifecycle

## License

MIT
