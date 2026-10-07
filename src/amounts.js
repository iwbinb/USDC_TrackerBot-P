export function validateDecimals(decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new RangeError('Decimal precision must be an integer from 0 to 18');
  }
  return decimals;
}

export function readUnits(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value !== 'string' || !/^(?:0|-?[1-9]\d*)$/.test(value)) {
    throw new TypeError('Use BigInt or a canonical integer string for smallest units');
  }
  return BigInt(value);
}

export function parseUnits(value, decimals = 6) {
  validateDecimals(decimals);
  if (typeof value !== 'string') throw new TypeError('Use a decimal string');
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) throw new TypeError('Invalid non-negative decimal amount');
  const [, whole, fraction = ''] = match;
  if (fraction.length > decimals) throw new RangeError('Amount exceeds decimal precision');
  return BigInt(whole) * 10n ** BigInt(decimals)
    + BigInt(fraction.padEnd(decimals, '0') || '0');
}

export function formatUnits(value, decimals = 6) {
  validateDecimals(decimals);
  const units = readUnits(value);
  const magnitude = units < 0n ? -units : units;
  const scale = 10n ** BigInt(decimals);
  const whole = magnitude / scale;
  const fraction = (magnitude % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${units < 0n ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

export function scaleUnits(value, fromDecimals, toDecimals) {
  validateDecimals(fromDecimals);
  validateDecimals(toDecimals);
  const units = readUnits(value);
  if (toDecimals >= fromDecimals) {
    return units * 10n ** BigInt(toDecimals - fromDecimals);
  }
  const divisor = 10n ** BigInt(fromDecimals - toDecimals);
  if (units % divisor !== 0n) throw new RangeError('Scaling would discard precision');
  return units / divisor;
}
