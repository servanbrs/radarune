const DECIMAL_SCALE = 100000000n;

export function decimalStringToScaledBigInt(value: string) {
  const [wholePart = "0", fractionalPart = ""] = value.split(".");
  const normalizedFraction = `${fractionalPart}00000000`.slice(0, 8);

  return BigInt(wholePart) * DECIMAL_SCALE + BigInt(normalizedFraction);
}

export function applyRateToMinorUnits(amountMinor: bigint, rate: string) {
  const scaledRate = decimalStringToScaledBigInt(rate);

  return (amountMinor * scaledRate + DECIMAL_SCALE / 2n) / DECIMAL_SCALE;
}

export function applyBasisPoints(amountMinor: bigint, basisPoints: number) {
  return (amountMinor * BigInt(basisPoints) + 5000n) / 10000n;
}

export function sumBigInt(values: readonly bigint[]) {
  return values.reduce((total, value) => total + value, 0n);
}
