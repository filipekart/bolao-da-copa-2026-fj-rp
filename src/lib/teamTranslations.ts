// Team name translations keyed by fifa_code
const teamTranslations: Record<string, Record<string, string>> = {
  RSA: { pt: 'África do Sul', en: 'South Africa', es: 'Sudáfrica', fr: 'Afrique du Sud' },
  GER: { pt: 'Alemanha', en: 'Germany', es: 'Alemania', fr: 'Allemagne' },
  KSA: { pt: 'Arábia Saudita', en: 'Saudi Arabia', es: 'Arabia Saudita', fr: 'Arabie saoudite' },
  ALG: { pt: 'Argélia', en: 'Algeria', es: 'Argelia', fr: 'Algérie' },
  ARG: { pt: 'Argentina', en: 'Argentina', es: 'Argentina', fr: 'Argentine' },
  AUS: { pt: 'Austrália', en: 'Australia', es: 'Australia', fr: 'Australie' },
  AUT: { pt: 'Áustria', en: 'Austria', es: 'Austria', fr: 'Autriche' },
  BEL: { pt: 'Bélgica', en: 'Belgium', es: 'Bélgica', fr: 'Belgique' },
  BIH: { pt: 'Bósnia e Herzegovina', en: 'Bosnia and Herzegovina', es: 'Bosnia y Herzegovina', fr: 'Bosnie-Herzégovine' },
  BRA: { pt: 'Brasil', en: 'Brazil', es: 'Brasil', fr: 'Brésil' },
  CPV: { pt: 'Cabo Verde', en: 'Cape Verde', es: 'Cabo Verde', fr: 'Cap-Vert' },
  CAN: { pt: 'Canadá', en: 'Canada', es: 'Canadá', fr: 'Canada' },
  QAT: { pt: 'Catar', en: 'Qatar', es: 'Catar', fr: 'Qatar' },
  COL: { pt: 'Colômbia', en: 'Colombia', es: 'Colombia', fr: 'Colombie' },
  KOR: { pt: 'Coreia do Sul', en: 'South Korea', es: 'Corea del Sur', fr: 'Corée du Sud' },
  CIV: { pt: 'Costa do Marfim', en: 'Ivory Coast', es: 'Costa de Marfil', fr: "Côte d'Ivoire" },
  CRO: { pt: 'Croácia', en: 'Croatia', es: 'Croacia', fr: 'Croatie' },
  CUW: { pt: 'Curaçao', en: 'Curaçao', es: 'Curazao', fr: 'Curaçao' },
  EGY: { pt: 'Egito', en: 'Egypt', es: 'Egipto', fr: 'Égypte' },
  ECU: { pt: 'Equador', en: 'Ecuador', es: 'Ecuador', fr: 'Équateur' },
  SCO: { pt: 'Escócia', en: 'Scotland', es: 'Escocia', fr: 'Écosse' },
  ESP: { pt: 'Espanha', en: 'Spain', es: 'España', fr: 'Espagne' },
  USA: { pt: 'Estados Unidos', en: 'United States', es: 'Estados Unidos', fr: 'États-Unis' },
  FRA: { pt: 'França', en: 'France', es: 'Francia', fr: 'France' },
  GHA: { pt: 'Gana', en: 'Ghana', es: 'Ghana', fr: 'Ghana' },
  HAI: { pt: 'Haïti', en: 'Haiti', es: 'Haití', fr: 'Haïti' },
  NED: { pt: 'Holanda', en: 'Netherlands', es: 'Países Bajos', fr: 'Pays-Bas' },
  ENG: { pt: 'Inglaterra', en: 'England', es: 'Inglaterra', fr: 'Angleterre' },
  IRN: { pt: 'Irã', en: 'Iran', es: 'Irán', fr: 'Iran' },
  JPN: { pt: 'Japão', en: 'Japan', es: 'Japón', fr: 'Japon' },
  JOR: { pt: 'Jordânia', en: 'Jordan', es: 'Jordania', fr: 'Jordanie' },
  MAR: { pt: 'Marrocos', en: 'Morocco', es: 'Marruecos', fr: 'Maroc' },
  MEX: { pt: 'México', en: 'Mexico', es: 'México', fr: 'Mexique' },
  NOR: { pt: 'Noruega', en: 'Norway', es: 'Noruega', fr: 'Norvège' },
  NZL: { pt: 'Nova Zelândia', en: 'New Zealand', es: 'Nueva Zelanda', fr: 'Nouvelle-Zélande' },
  PAN: { pt: 'Panamá', en: 'Panama', es: 'Panamá', fr: 'Panama' },
  PAR: { pt: 'Paraguai', en: 'Paraguay', es: 'Paraguay', fr: 'Paraguay' },
  POR: { pt: 'Portugal', en: 'Portugal', es: 'Portugal', fr: 'Portugal' },
  CZE: { pt: 'República Tcheca', en: 'Czech Republic', es: 'República Checa', fr: 'République tchèque' },
  SEN: { pt: 'Senegal', en: 'Senegal', es: 'Senegal', fr: 'Sénégal' },
  SWE: { pt: 'Suécia', en: 'Sweden', es: 'Suecia', fr: 'Suède' },
  SUI: { pt: 'Suíça', en: 'Switzerland', es: 'Suiza', fr: 'Suisse' },
  TUN: { pt: 'Tunísia', en: 'Tunisia', es: 'Túnez', fr: 'Tunisie' },
  TUR: { pt: 'Turquia', en: 'Turkey', es: 'Turquía', fr: 'Turquie' },
  URU: { pt: 'Uruguai', en: 'Uruguay', es: 'Uruguay', fr: 'Uruguay' },
  UZB: { pt: 'Uzbequistão', en: 'Uzbekistan', es: 'Uzbekistán', fr: 'Ouzbékistan' },
  COD: { pt: 'RD Congo', en: 'DR Congo', es: 'RD Congo', fr: 'RD Congo' },
  IRQ: { pt: 'Iraque', en: 'Iraq', es: 'Irak', fr: 'Irak' },
};

/**
 * Translate a team name based on the current language.
 * Falls back to the original name if no translation is found.
 */
export function translateTeamName(
  name: string,
  fifaCode: string | null | undefined,
  language: string
): string {
  if (!fifaCode) return name;
  const lang = language?.substring(0, 2) || 'pt';
  const translation = teamTranslations[fifaCode];
  if (!translation) return name;
  return translation[lang] || translation['pt'] || name;
}
