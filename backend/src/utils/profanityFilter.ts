// Turkish profanity / inappropriate content filter

const PROFANITY_LIST: string[] = [
  // Yaygın Türkçe küfürler ve argo ifadeler
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
  'köpek', 'kopek', 'it', 'hayvan',  // these are short but used as insults
  'eşek', 'esek', 'öküz', 'okuz',
  'kancık', 'kancik',
  'hıyar', 'hiyar',
  'puşt', 'pust',
  'yallah',
  'g*t', 's*k', 'a*k', 'a*q',
];

// Short words that should only match as whole words (to avoid false positives)
const SHORT_WORDS = new Set(['aq', 'amk', 'amq', 'bok', 'mal', 'got', 'göt', 'sik', 'pic', 'piç', 'it', 'dol', 'döl', 'skm']);

/**
 * Normalize text: remove obfuscation characters and Turkish chars
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    // Remove common obfuscation: dots, stars, dashes, underscores between letters
    .replace(/[.\-_*#@!+\/\\|]+/g, '')
    // Collapse multiple spaces into single
    .replace(/\s+/g, ' ')
    // Turkish character normalization
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

/**
 * Create a version of text with spaces between letters removed
 * This catches "s i k t i r" style obfuscation
 */
function removeIntraWordSpaces(text: string): string {
  // Check for patterns where single characters are separated by spaces: "s i k"
  return text.replace(/(?<=\b\w)\s(?=\w\b)/g, '').replace(/(\w)\s(\w)\s/g, '$1$2 ');
}

/**
 * Check if text contains profanity
 * @returns true if profanity is detected
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const normalized = normalize(text);
  // Also create a version with spaces stripped for obfuscation detection
  const noSpaces = normalized.replace(/\s/g, '');
  const deSpaced = removeIntraWordSpaces(normalized);

  for (const word of PROFANITY_LIST) {
    const normalizedWord = normalize(word);

    if (SHORT_WORDS.has(word)) {
      // For short words, require word boundary matching
      const regex = new RegExp(`\\b${escapeRegex(normalizedWord)}\\b`, 'i');
      if (regex.test(normalized) || regex.test(deSpaced)) return true;
    } else {
      // For longer words, check substring match (catches compound words)
      if (normalized.includes(normalizedWord)) return true;
      if (noSpaces.includes(normalizedWord)) return true;
      if (deSpaced.includes(normalizedWord)) return true;
    }
  }

  return false;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check multiple fields at once
 * @returns the name of the first field that contains profanity, or null
 */
export function checkFieldsForProfanity(fields: Record<string, string | undefined>): string | null {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value && containsProfanity(value)) {
      return fieldName;
    }
  }
  return null;
}
