export interface GpaItem {
  credits: number;
  gradePoint: number;
}

export function calculateGpa(items: GpaItem[]): number {
  const attemptedCredits = items.reduce((sum, item) => sum + item.credits, 0);
  if (!attemptedCredits) return 0;
  const weightedPoints = items.reduce(
    (sum, item) => sum + item.credits * item.gradePoint,
    0,
  );
  return Number((weightedPoints / attemptedCredits).toFixed(2));
}
