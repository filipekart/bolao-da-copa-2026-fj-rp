// Standard competition ranking ("1,1,1,4").
// Receives an ALREADY sorted list and the keys that define a tie.
// Returns a parallel array of positions.
export function computePositions<T>(
  rows: T[],
  tieKeys: (keyof T)[]
): number[] {
  const positions: number[] = [];
  rows.forEach((row, idx) => {
    if (idx === 0) {
      positions.push(1);
      return;
    }
    const prev = rows[idx - 1];
    const tied = tieKeys.every(k => (row[k] ?? 0) === (prev[k] ?? 0));
    positions.push(tied ? positions[idx - 1] : idx + 1);
  });
  return positions;
}