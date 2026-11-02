const HTML_TAG_PATTERN = /<[^>]*>/g;
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
};

const MONTHS_PT_BR = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * A sinopse da TMDB vem em texto simples, mas alguns títulos trazem sobras de
 * marcação vindas de fontes externas (`<br>`, `&amp;`, espaços duplicados).
 * Esta função remove tags, resolve entidades e normaliza o espaçamento.
 */
export function cleanHtmlText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(HTML_TAG_PATTERN, '')
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(
      /&([a-z]+);/gi,
      (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match,
    )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    return 'Duração não informada';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}min`;
  }
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Formata `YYYY-MM-DD` sem passar por `new Date()`, evitando o deslocamento de
 * fuso que faria 1999-10-15 virar 14/10/1999 em fusos negativos.
 */
export function formatReleaseDate(releaseDate: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(releaseDate?.trim() ?? '');
  if (!match) {
    return 'Data de lançamento não informada';
  }

  const [, year, month, day] = match;
  const monthName = MONTHS_PT_BR[Number(month) - 1];
  if (!monthName) {
    return 'Data de lançamento não informada';
  }

  return `${Number(day)} de ${monthName} de ${year}`;
}

export function getReleaseYear(releaseDate: string | null | undefined): string {
  const year = releaseDate?.slice(0, 4);
  return year && /^\d{4}$/.test(year) ? year : 'Sem data';
}

export function formatVoteAverage(
  voteAverage: number,
  voteCount: number,
): string {
  if (voteCount <= 0) {
    return 'Sem nota';
  }
  return voteAverage.toFixed(1).replace('.', ',');
}

const STATUS_PT_BR: Record<string, string> = {
  Rumored: 'Rumor',
  Planned: 'Planejado',
  'In Production': 'Em produção',
  'Post Production': 'Pós-produção',
  Released: 'Lançado',
  Canceled: 'Cancelado',
};

export function formatStatus(status: string | null | undefined): string {
  if (!status) {
    return 'Não informada';
  }
  return STATUS_PT_BR[status] ?? status;
}
