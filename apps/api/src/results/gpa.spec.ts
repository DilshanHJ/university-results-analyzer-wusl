import { describe, expect, it } from 'vitest';
import { calculateGpa } from './gpa.js';

describe('calculateGpa', () => {
  it('returns a credit-weighted GPA rounded to two decimals', () => {
    expect(
      calculateGpa([
        { credits: 3, gradePoint: 4 },
        { credits: 2, gradePoint: 3 },
      ]),
    ).toBe(3.6);
  });

  it('returns zero when no credits were attempted', () => {
    expect(calculateGpa([])).toBe(0);
  });
});
