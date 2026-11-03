export function toPaise(value) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new TypeError('Money value must be a number or decimal string');
  }
  const decimal = String(value).trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(decimal);
  if (!match) {
    throw new TypeError('Money value must be a finite decimal amount');
  }
  const sign = match[1] === '-' ? -1n : 1n;
  const whole = BigInt(match[2]);
  const fraction = (match[3] ?? '').padEnd(3, '0');
  let paise = whole * 100n + BigInt(fraction.slice(0, 2));
  if (Number(fraction[2] ?? '0') >= 5) paise += 1n;
  const result = sign * paise;
  if (result > BigInt(Number.MAX_SAFE_INTEGER) || result < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Money value exceeds the safe integer range');
  }
  return Number(result);
}

export function fromPaise(value) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError('Paise value must be a safe integer');
  }
  return amount / 100;
}

/**
 * Multiplies an integer paise amount by a decimal rate using integer arithmetic.
 */
export function multiplyPaiseByRate(paise, rate) {
  if (!Number.isSafeInteger(paise) || paise < 0) {
    throw new TypeError('Paise amount must be a non-negative safe integer');
  }
  const match = /^(\d+)(?:\.(\d+))?$/.exec(String(rate));
  if (!match) throw new TypeError('Rate must be a non-negative decimal number');
  const fraction = match[2] ?? '';
  if (fraction.length > 6) throw new TypeError('Rate supports at most six decimal places');
  const denominator = 10n ** BigInt(fraction.length);
  const numerator = BigInt(match[1]) * denominator + BigInt(fraction || '0');
  const product = BigInt(paise) * numerator;
  const rounded = (product * 2n + denominator) / (denominator * 2n);
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER) || rounded < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Calculated paise exceeds the safe integer range');
  }
  return Number(rounded);
}

/**
 * Adds non-negative paise amounts and rejects unsafe intermediate totals.
 */
export function sumPaise(amounts, label = 'Total') {
  const total = amounts.reduce((sum, amount) => {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new TypeError(`${label} contains an invalid paise amount`);
    }
    const next = sum + amount;
    if (!Number.isSafeInteger(next)) throw new RangeError(`${label} exceeds the safe paise range`);
    return next;
  }, 0);
  return total;
}

export function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromPaise(value));
}
