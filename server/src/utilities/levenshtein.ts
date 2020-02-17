/**
 * Levenshtein Distance between a string a and b
 * @param a first string
 * @param b second string
 */
export function levenshteinDistance(a: string, b: string) {
  const distanceMatrix: number[][] = Array(b.length + 1)
    .fill(0)
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) {
    distanceMatrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    distanceMatrix[j][0] = j;
  }

  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      distanceMatrix[j][i] = Math.min(
        distanceMatrix[j][i - 1] + 1, // deletion
        distanceMatrix[j - 1][i] + 1, // insertion
        distanceMatrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return distanceMatrix[b.length][a.length];
}
