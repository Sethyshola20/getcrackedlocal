export function reflectionScore(criteria: boolean[]): number {
  return criteria.length
    ? Math.round((criteria.filter(Boolean).length / criteria.length) * 100)
    : 0;
}
