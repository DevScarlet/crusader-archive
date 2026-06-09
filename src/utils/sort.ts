export function compareOptionalNumbers(
  firstValue: number | undefined,
  secondValue: number | undefined,
  direction: 'asc' | 'desc',
): number {
  const firstIsMissing =
    firstValue === undefined || !Number.isFinite(firstValue)
  const secondIsMissing =
    secondValue === undefined || !Number.isFinite(secondValue)

  if (firstIsMissing) {
    return secondIsMissing ? 0 : 1
  }

  if (secondIsMissing) {
    return -1
  }

  return direction === 'asc'
    ? firstValue - secondValue
    : secondValue - firstValue
}
