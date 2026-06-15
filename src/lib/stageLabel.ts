import type { TFunction } from 'i18next';

export function getStageKey(stage: string, matchNumber?: number | null): string {
  if (stage === 'GROUP_STAGE' && matchNumber != null) {
    if (matchNumber <= 24) return 'ROUND_1';
    if (matchNumber <= 48) return 'ROUND_2';
    if (matchNumber <= 72) return 'ROUND_3';
  }
  return stage;
}

export function formatStageLabel(
  t: TFunction | ((k: string, opts?: any) => string),
  stage: string,
  matchNumber?: number | null,
): string {
  const key = getStageKey(stage, matchNumber);
  return (t as any)(`match.stages.${key}`, { defaultValue: stage.replace(/_/g, ' ') });
}