import React from 'react';
import { CopyButton } from '../components/CopyButton';

function CodeBlock({ code, lang = '' }: { code: string; lang?: string }) {
  return (
    <div className="relative group">
      <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-gray-300">{code}</code>
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {children}
    </section>
  );
}

export function Docs() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Developer Documentation</h2>
        <p className="text-sm text-gray-500 mt-1">
          DigiDollar SDK — build applications on the DigiDollar stablecoin protocol
        </p>
      </div>

      {/* Protocol Overview */}
      <Section title="Protocol Overview">
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-gray-300">
            DigiDollar (DD) is a decentralized stablecoin protocol built on DigiByte. Users lock DGB
            as collateral to mint DD tokens pegged to $1 USD. Oracle nodes provide real-time DGB/USD
            pricing for collateral valuation. The protocol uses Taproot (P2TR) scripts with MAST
            redemption paths for secure UTXO-based token management.
          </p>
        </div>
      </Section>

      {/* Installation */}
      <Section title="Installation">
        <CodeBlock code={`npm install @digidollar/core`} />
        <p className="text-sm text-gray-400">
          The core package includes all four SDK modules: rpc-client, tx-parser, tx-builder, and the
          high-level DigiDollar facade.
        </p>
        <p className="text-sm text-gray-400">
          Individual packages are also available:
        </p>
        <CodeBlock code={`npm install @digidollar/rpc-client  # RPC communication
npm install @digidollar/tx-parser   # Transaction parsing
npm install @digidollar/tx-builder  # Transaction construction`} />
      </Section>

      {/* Quick Start */}
      <Section title="Quick Start">
        <CodeBlock
          lang="typescript"
          code={`import { DigiDollar, BIP86Signer } from '@digidollar/core';

// 1. Create a signer from mnemonic
const signer = BIP86Signer.fromMnemonic(
  'your twelve word mnemonic phrase ...',
  'testnet'
);

// 2. Initialize the SDK
const dd = new DigiDollar({
  network: 'testnet',
  rpc: {
    host: '127.0.0.1',
    port: 14024,
    username: 'rpcuser',
    password: 'rpcpass',
  },
  signer,
});

// 3. Check oracle price
const oracle = await dd.getOraclePrice();
console.log('DGB/USD:', Number(oracle.priceMicroUsd) / 1e6);

// 4. Mint $100 in DigiDollars (30-day lock)
const mint = await dd.mint({
  ddAmountCents: 10000n,  // $100.00
  lockTier: 1,            // 30 days, 500% collateral
});
console.log('Minted! TX:', mint.txid);

// 5. Transfer $50 DD
const transfer = await dd.transfer({
  recipients: [{
    toAddress: 'TD1abc...',
    ddAmountCents: 5000n,
  }],
});

// 6. Redeem position (after lock expires)
const redeem = await dd.redeem({
  positionId: mint.txid,
});`}
        />
      </Section>

      {/* SDK Packages */}
      <Section title="SDK Packages">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="pb-2 pr-4 text-left font-medium">Package</th>
                <th className="pb-2 pr-4 text-left font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-dgb-accent">@digidollar/core</td>
                <td className="py-2">High-level facade — mint, transfer, redeem, positions</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-dgb-accent">@digidollar/rpc-client</td>
                <td className="py-2">DigiByte node RPC communication and DD-specific commands</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-dgb-accent">@digidollar/tx-parser</td>
                <td className="py-2">Parse raw transactions into typed DD operations</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-mono text-dgb-accent">@digidollar/tx-builder</td>
                <td className="py-2">Build and sign DD transactions (Taproot/P2TR)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference — DigiDollar Class">
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h4 className="font-mono text-sm text-dgb-accent">constructor(config: DigiDollarConfig)</h4>
            <p className="text-sm text-gray-400 mt-1">
              Create a new DigiDollar instance. Requires <code className="text-gray-300">network</code>,
              optional <code className="text-gray-300">rpc</code> config, optional{' '}
              <code className="text-gray-300">signer</code> (required for write operations).
            </p>
          </div>

          {[
            { sig: 'getOraclePrice(): Promise<OracleSnapshot>', desc: 'Get current DGB/USD oracle price with staleness info and oracle count.' },
            { sig: 'getBalance(address?: string): Promise<DDBalance>', desc: 'Get DD balance (confirmed, unconfirmed, total) for wallet or specific address.' },
            { sig: 'getPositions(activeOnly?: boolean): Promise<EnrichedPosition[]>', desc: 'Get all collateral positions with health status, time remaining, and redeemability.' },
            { sig: 'getStats(): Promise<DDStats>', desc: 'Get system-wide stats: health, total supply, collateral, oracle price.' },
            { sig: 'getReceiveAddress(): Promise<string>', desc: 'Derive next unused receive address from the signer.' },
            { sig: 'getBlockHeight(): Promise<number>', desc: 'Get current blockchain tip height.' },
            { sig: 'getUTXOs(): Promise<ClassifiedUTXOSet>', desc: 'Get UTXOs classified as standard DGB, DD tokens, or DD collateral.' },
            { sig: 'estimateCollateral(ddAmountCents: bigint, lockTier: number): Promise<CollateralEstimate>', desc: 'Estimate DGB collateral required for a given DD mint amount and lock tier.' },
            { sig: 'mint(req: MintRequest): Promise<MintResult>', desc: 'Mint DD by locking DGB collateral. Returns txid, amounts, and unlock height.' },
            { sig: 'transfer(req: TransferRequest): Promise<TransferResult>', desc: 'Transfer DD tokens to one or more recipients.' },
            { sig: 'redeem(req: RedeemRequest): Promise<RedeemResult>', desc: 'Redeem a position to burn DD and unlock DGB collateral.' },
          ].map((m) => (
            <div key={m.sig} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h4 className="font-mono text-sm text-dgb-accent">{m.sig}</h4>
              <p className="text-sm text-gray-400 mt-1">{m.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Lock Tiers */}
      <Section title="Lock Tiers">
        <p className="text-sm text-gray-400">
          Longer lock periods require less collateral per DD minted.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="pb-2 pr-4 text-left font-medium">Tier</th>
                <th className="pb-2 pr-4 text-left font-medium">Lock Period</th>
                <th className="pb-2 pr-4 text-left font-medium">Collateral Ratio</th>
                <th className="pb-2 text-left font-medium">Blocks</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {[
                [0, '1 hour', '1000%', '240'],
                [1, '30 days', '500%', '172,800'],
                [2, '90 days', '400%', '518,400'],
                [3, '180 days', '350%', '1,036,800'],
                [4, '1 year', '300%', '2,102,400'],
                [5, '2 years', '275%', '4,204,800'],
                [6, '3 years', '250%', '6,307,200'],
                [7, '5 years', '225%', '10,512,000'],
                [8, '7 years', '212%', '14,716,800'],
                [9, '10 years', '200%', '21,024,000'],
              ].map(([tier, period, ratio, blocks]) => (
                <tr key={String(tier)} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4">{tier}</td>
                  <td className="py-2 pr-4">{period}</td>
                  <td className="py-2 pr-4 font-medium">{ratio}</td>
                  <td className="py-2 text-gray-500">{blocks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Error Handling */}
      <Section title="Error Handling">
        <p className="text-sm text-gray-400 mb-3">
          All SDK errors extend <code className="text-gray-300">CoreError</code>. Catch specific error
          types for granular handling:
        </p>
        <CodeBlock
          code={`import {
  StalePriceError,
  InsufficientFundsError,
  InsufficientDDError,
  PositionError,
  AddressError,
  BackendError,
  NoSignerError,
} from '@digidollar/core';

try {
  await dd.mint({ ddAmountCents: 10000n, lockTier: 1 });
} catch (err) {
  if (err instanceof StalePriceError) {
    console.log('Oracle price stale, age:', err.priceAgeSecs);
  } else if (err instanceof InsufficientFundsError) {
    console.log('Need', err.required, 'sats, have', err.available);
  }
}`}
        />
      </Section>

      {/* Links */}
      <Section title="Links">
        <ul className="text-sm text-gray-400 space-y-1">
          <li>
            <a href="https://github.com/DigiByte-Core/digibyte" className="text-dgb-accent hover:underline">
              DigiByte Core Repository
            </a>
          </li>
          <li>
            <a href="https://digibyte.org" className="text-dgb-accent hover:underline">
              DigiByte Official Site
            </a>
          </li>
        </ul>
      </Section>

      <div className="h-8" />
    </div>
  );
}
