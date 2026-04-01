import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeams } from '@/hooks/useTeams';
import { translateTeamName } from '@/lib/teamTranslations';

/**
 * Returns a function that translates a team name by team_id.
 * Falls back to the original name if no translation is found.
 */
export function useTranslatedTeamName() {
  const { i18n } = useTranslation();
  const { data: teams } = useTeams();
  const lang = i18n.language?.substring(0, 2) || 'pt';

  const teamMap = useMemo(() => {
    const map = new Map<string, { name: string; fifa_code: string | null }>();
    teams?.forEach(t => map.set(t.id, { name: t.name, fifa_code: t.fifa_code }));
    return map;
  }, [teams]);

  return (teamId: string | null | undefined, fallbackName?: string): string => {
    if (!teamId) return fallbackName || '';
    const team = teamMap.get(teamId);
    if (!team) return fallbackName || '';
    return translateTeamName(team.name, team.fifa_code, lang);
  };
}

/**
 * Translates a team name directly using fifa_code (when you already have it).
 */
export function useTeamNameByCode() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) || 'pt';

  return (name: string, fifaCode: string | null | undefined): string => {
    return translateTeamName(name, fifaCode, lang);
  };
}
