import { digitsOnly, formatDateTime, formatIDR } from '../src/utils/format';

describe('formatIDR', () => {
  it('groups thousands with dots', () => {
    expect(formatIDR(15000)).toBe('Rp15.000');
    expect(formatIDR(2500)).toBe('Rp2.500');
    expect(formatIDR(250000000)).toBe('Rp250.000.000');
  });

  it('handles small, zero and nullish values', () => {
    expect(formatIDR(0)).toBe('Rp0');
    expect(formatIDR(999)).toBe('Rp999');
    expect(formatIDR(null)).toBe('Rp0');
    expect(formatIDR(undefined)).toBe('Rp0');
    expect(formatIDR('')).toBe('Rp0');
  });

  it('accepts numeric strings (BigDecimal over JSON)', () => {
    expect(formatIDR('1500000')).toBe('Rp1.500.000');
    expect(formatIDR('6500.00')).toBe('Rp6.500');
  });

  it('marks negatives', () => {
    expect(formatIDR(-15000)).toBe('-Rp15.000');
  });
});

describe('digitsOnly', () => {
  it('strips everything but digits', () => {
    expect(digitsOnly('1.500,00')).toBe('150000');
    expect(digitsOnly('+62 812-345')).toBe('62812345');
    expect(digitsOnly('abc')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formats an ISO timestamp', () => {
    expect(formatDateTime('2026-07-19T14:05:00+07:00')).toMatch(/Jul 2026 \d{2}:\d{2}/);
  });

  it('is defensive about bad input', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
  });
});
