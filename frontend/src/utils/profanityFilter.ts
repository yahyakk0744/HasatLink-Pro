// Turkish profanity / inappropriate content filter (frontend mirror)

const PROFANITY_LIST: string[] = [
  'amk', 'aq', 'amq', 'amina', 'amini', 'aminakoyim', 'aminakoyayim',
  'ananı', 'anani', 'ananin', 'ananızı', 'anasini', 'anasını',
  'orospu', 'orospucocugu', 'orospuçocuğu', 'orosbucocugu',
  'piç', 'pic', 'piclik', 'piçlik',
  'sik', 'sikim', 'sikik', 'sikerim', 'sikerим', 'sikeyim', 'siktir', 'siktir', 'siktirin', 'siktirgit',
  'yarrak', 'yarak', 'yarrак', 'yarram', 'yarrami',
  'göt', 'got', 'gotun', 'götün', 'götveren', 'gotveren', 'gotlek', 'götlek',
  'dalyarak', 'dallama', 'dalyarак',
  'pezevenk', 'puşt', 'pust', 'ibne', 'ибне',
  'gavat', 'kahpe', 'kaltak', 'kevaşe', 'kevase',
  'manyak', 'gerizekalı', 'gerizekali', 'salak', 'aptal', 'mal',
  'haysiyetsiz', 'namussuz', 'şerefsiz', 'serefsiz', 'alçak', 'alcak',
  'dangalak', 'godoş', 'godos', 'andaval', 'ahmak',
  'yavşak', 'yavsak', 'boktan', 'bok', 'boklu',
  'hassiktir', 'hassik', 'hasiktir',
  'skim', 'skm', 'skrm', 'skyim',
  'amcik', 'amcık', 'amcuk',
  'döl', 'dol',
  'gavur', 'kafir',
  'beynini', 'kafani', 'kafanı',
  'coduk', 'çocuğunu',
  'orspu', 'orsbu', 'oruspu',
  'sokayim', 'sokayım', 'sokarım', 'sokarim',
  'taşak', 'tasak', 'tassak', 'taşşak',
  'zıkkım', 'zikkim',
  'köpek', 'kopek', 'it', 'hayvan',
  'eşek', 'esek', 'öküz', 'okuz',
  'kancık', 'kancik',
  'hıyar', 'hiyar',
  'puşt', 'pust',
  'yallah',
  'g*t', 's*k', 'a*k', 'a*q',
];

const SHORT_WORDS = new Set(['aq', 'amk', 'amq', 'bok', 'mal', 'got', 'göt', 'sik', 'pic', 'piç', 'it', 'dol', 'döl', 'skm']);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.\-_*#@!+\/\\|]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');
}

function removeIntraWordSpaces(text: string): string {
  return text.replace(/(?<=\b\w)\s(?=\w\b)/g, '').replace(/(\w)\s(\w)\s/g, '$1$2 ');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const normalized = normalize(text);
  const noSpaces = normalized.replace(/\s/g, '');
  const deSpaced = removeIntraWordSpaces(normalized);

  for (const word of PROFANITY_LIST) {
    const normalizedWord = normalize(word);

    if (SHORT_WORDS.has(word)) {
      const regex = new RegExp(`\\b${escapeRegex(normalizedWord)}\\b`, 'i');
      if (regex.test(normalized) || regex.test(deSpaced)) return true;
    } else {
      if (normalized.includes(normalizedWord)) return true;
      if (noSpaces.includes(normalizedWord)) return true;
      if (deSpaced.includes(normalizedWord)) return true;
    }
  }

  return false;
}
