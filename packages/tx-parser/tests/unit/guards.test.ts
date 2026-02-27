import { describe, it, expect } from 'vitest';
import { isDDToken, isDDCollateral, isDDMetadata, isStandard, isDDOutput, filterSafeOutputs } from '../../src/guards.js';
import type { ClassifiedOutput } from '../../src/types/classified.js';

function makeClassified(classification: ClassifiedOutput['classification'], n = 0): ClassifiedOutput {
  return {
    value: classification === 'dd_token' ? 0 : 1.0,
    n,
    index: n,
    classification,
    scriptPubKey: { asm: '', hex: '', type: '' },
  };
}

describe('type guards', () => {
  const token = makeClassified('dd_token', 0);
  const collateral = makeClassified('dd_collateral', 1);
  const metadata = makeClassified('dd_metadata', 2);
  const standard = makeClassified('standard', 3);

  describe('isDDToken', () => {
    it('returns true for dd_token', () => expect(isDDToken(token)).toBe(true));
    it('returns false for others', () => {
      expect(isDDToken(collateral)).toBe(false);
      expect(isDDToken(metadata)).toBe(false);
      expect(isDDToken(standard)).toBe(false);
    });
  });

  describe('isDDCollateral', () => {
    it('returns true for dd_collateral', () => expect(isDDCollateral(collateral)).toBe(true));
    it('returns false for others', () => {
      expect(isDDCollateral(token)).toBe(false);
      expect(isDDCollateral(standard)).toBe(false);
    });
  });

  describe('isDDMetadata', () => {
    it('returns true for dd_metadata', () => expect(isDDMetadata(metadata)).toBe(true));
    it('returns false for others', () => {
      expect(isDDMetadata(token)).toBe(false);
      expect(isDDMetadata(standard)).toBe(false);
    });
  });

  describe('isStandard', () => {
    it('returns true for standard', () => expect(isStandard(standard)).toBe(true));
    it('returns false for DD outputs', () => {
      expect(isStandard(token)).toBe(false);
      expect(isStandard(collateral)).toBe(false);
      expect(isStandard(metadata)).toBe(false);
    });
  });

  describe('isDDOutput', () => {
    it('returns true for all DD types', () => {
      expect(isDDOutput(token)).toBe(true);
      expect(isDDOutput(collateral)).toBe(true);
      expect(isDDOutput(metadata)).toBe(true);
    });
    it('returns false for standard', () => {
      expect(isDDOutput(standard)).toBe(false);
    });
  });
});

describe('filterSafeOutputs', () => {
  it('returns only standard outputs from a mint tx', () => {
    const outputs: ClassifiedOutput[] = [
      makeClassified('dd_collateral', 0),
      makeClassified('dd_token', 1),
      makeClassified('dd_metadata', 2),
      makeClassified('standard', 3),
    ];

    const safe = filterSafeOutputs(outputs);
    expect(safe).toHaveLength(1);
    expect(safe[0].classification).toBe('standard');
    expect(safe[0].index).toBe(3);
  });

  it('returns empty array when all outputs are DD', () => {
    const outputs: ClassifiedOutput[] = [
      makeClassified('dd_collateral', 0),
      makeClassified('dd_token', 1),
      makeClassified('dd_metadata', 2),
    ];

    expect(filterSafeOutputs(outputs)).toHaveLength(0);
  });

  it('returns all outputs when none are DD', () => {
    const outputs: ClassifiedOutput[] = [
      makeClassified('standard', 0),
      makeClassified('standard', 1),
    ];

    const safe = filterSafeOutputs(outputs);
    expect(safe).toHaveLength(2);
  });

  it('returns empty for empty input', () => {
    expect(filterSafeOutputs([])).toHaveLength(0);
  });

  it('handles transfer with mixed outputs', () => {
    const outputs: ClassifiedOutput[] = [
      makeClassified('dd_token', 0),
      makeClassified('dd_token', 1),
      makeClassified('dd_metadata', 2),
      makeClassified('standard', 3),
      makeClassified('standard', 4),
    ];

    const safe = filterSafeOutputs(outputs);
    expect(safe).toHaveLength(2);
    expect(safe[0].index).toBe(3);
    expect(safe[1].index).toBe(4);
  });
});
