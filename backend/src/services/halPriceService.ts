import axios from 'axios';

// İzmir Büyükşehir Belediyesi Açık Veri API - Ücretsiz, auth gerektirmez
const IZMIR_HAL_API = 'https://openapi.izmir.bel.tr/api/ibb/halfiyatlari/sebzemeyve';

// Ürün İngilizce çevirileri ve kategorileri (API'deki isimlerle eşleştirilmiş)
const NAME_MAP: Record<string, { en: string; category: string }> = {
  // Sebzeler
  'DOMATES': { en: 'Tomato', category: 'sebze' },
  'BİBER': { en: 'Pepper', category: 'sebze' },
  'PATLICAN': { en: 'Eggplant', category: 'sebze' },
  'KABAK': { en: 'Zucchini', category: 'sebze' },
  'SALATALIK': { en: 'Cucumber', category: 'sebze' },
  'HIYAR': { en: 'Cucumber', category: 'sebze' },
  'PATATES': { en: 'Potato', category: 'sebze' },
  'SOĞAN': { en: 'Onion', category: 'sebze' },
  'SARIMSAK': { en: 'Garlic', category: 'sebze' },
  'HAVUÇ': { en: 'Carrot', category: 'sebze' },
  'FASULYE': { en: 'Green Beans', category: 'sebze' },
  'BEZELYE': { en: 'Peas', category: 'sebze' },
  'ISPANAK': { en: 'Spinach', category: 'sebze' },
  'MARUL': { en: 'Lettuce', category: 'sebze' },
  'LAHANA': { en: 'Cabbage', category: 'sebze' },
  'BROKOLİ': { en: 'Broccoli', category: 'sebze' },
  'BROKOLI': { en: 'Broccoli', category: 'sebze' },
  'KARNABAHAR': { en: 'Cauliflower', category: 'sebze' },
  'PIRASA': { en: 'Leek', category: 'sebze' },
  'KEREVİZ': { en: 'Celery', category: 'sebze' },
  'BAMYA': { en: 'Okra', category: 'sebze' },
  'TURP': { en: 'Radish', category: 'sebze' },
  'ENGİNAR': { en: 'Artichoke', category: 'sebze' },
  'MANTAR': { en: 'Mushroom', category: 'sebze' },
  'MAYDANOZ': { en: 'Parsley', category: 'sebze' },
  'DEREOTU': { en: 'Dill', category: 'sebze' },
  'NANE': { en: 'Mint', category: 'sebze' },
  'ROKA': { en: 'Arugula', category: 'sebze' },
  'SEMİZOTU': { en: 'Purslane', category: 'sebze' },
  'ZENCEFİL': { en: 'Ginger', category: 'sebze' },
  'KARPUZ': { en: 'Watermelon', category: 'meyve' },
  'CİBEZ': { en: 'Cibez Pepper', category: 'sebze' },
  'DENİZ BÖRÜLCESİ': { en: 'Sea Beans', category: 'sebze' },
  // Meyveler
  'ELMA': { en: 'Apple', category: 'meyve' },
  'ARMUT': { en: 'Pear', category: 'meyve' },
  'PORTAKAL': { en: 'Orange', category: 'meyve' },
  'MANDALİNA': { en: 'Tangerine', category: 'meyve' },
  'LİMON': { en: 'Lemon', category: 'meyve' },
  'MUZ': { en: 'Banana', category: 'meyve' },
  'ÜZÜM': { en: 'Grape', category: 'meyve' },
  'NAR': { en: 'Pomegranate', category: 'meyve' },
  'KAVUN': { en: 'Melon', category: 'meyve' },
  'ÇİLEK': { en: 'Strawberry', category: 'meyve' },
  'CILEK': { en: 'Strawberry', category: 'meyve' },
  'KİRAZ': { en: 'Cherry', category: 'meyve' },
  'ŞEFTALİ': { en: 'Peach', category: 'meyve' },
  'ERİK': { en: 'Plum', category: 'meyve' },
  'KAYISI': { en: 'Apricot', category: 'meyve' },
  'İNCİR': { en: 'Fig', category: 'meyve' },
  'KİVİ': { en: 'Kiwi', category: 'meyve' },
  'AVAKADO': { en: 'Avocado', category: 'meyve' },
  'AVOKADO': { en: 'Avocado', category: 'meyve' },
  'ANANAS': { en: 'Pineapple', category: 'meyve' },
  'HURMA': { en: 'Date', category: 'meyve' },
  'GREYFURT': { en: 'Grapefruit', category: 'meyve' },
  'AYVA': { en: 'Quince', category: 'meyve' },
  'CENNET ELMASI': { en: 'Persimmon', category: 'meyve' },
  'HİNDİSTAN CEVİZİ': { en: 'Coconut', category: 'meyve' },
  'VİŞNE': { en: 'Sour Cherry', category: 'meyve' },
  'DUT': { en: 'Mulberry', category: 'meyve' },
  'BÖĞÜRTLEN': { en: 'Blackberry', category: 'meyve' },
  'AHUDUDU': { en: 'Raspberry', category: 'meyve' },
  'CEVİZ': { en: 'Walnut', category: 'meyve' },
  'FINDIK': { en: 'Hazelnut', category: 'meyve' },
  'BADEM': { en: 'Almond', category: 'meyve' },
  'ZEYTİN': { en: 'Olive', category: 'meyve' },
};

// Popüler ürünler - hero section'da ilk gösterilecekler
const POPULAR_KEYWORDS = [
  'DOMATES', 'BİBER', 'PATLICAN', 'SALATALIK', 'PATATES',
  'SOĞAN', 'LİMON', 'PORTAKAL', 'ELMA', 'KABAK',
  'HAVUÇ', 'MUZ', 'MANDALİNA', 'CILEK', 'ÇİLEK',
  'ISPANAK', 'FASULYE', 'MARUL', 'PIRASA', 'NAR',
  'KİVİ', 'ARMUT', 'BROKOLI', 'KARNABAHAR', 'LAHANA',
];

interface HalItem {
  OrtalamaUcret: number;
  MalAdi: string;
  Birim: string;
  AsgariUcret: number;
  AzamiUcret: number;
  MalTipAdi: string;
}

interface HalResponse {
  BultenTarihi: string;
  HalFiyatListesi: HalItem[];
}

interface TransformedPrice {
  name: string;
  nameEn: string;
  price: number;
  previousPrice: number;
  change: number;
  unit: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  malTipi: string;
  updatedAt: string;
}

// In-memory cache
let cachedPrices: TransformedPrice[] = [];
let cacheTime = 0;
let cachedAllPrices: TransformedPrice[] = [];
let cacheAllTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 dakika

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function getBaseKey(malAdi: string): string {
  // İlk kelimeyi al (ana ürün adı)
  const normalized = normalizeSpaces(malAdi).toUpperCase();
  return normalized.split(' ')[0];
}

function findTranslation(malAdi: string): { en: string; category: string } | null {
  const normalized = normalizeSpaces(malAdi).toUpperCase();

  // Tam eşleşme
  if (NAME_MAP[normalized]) return NAME_MAP[normalized];

  // İlk kelime eşleşmesi (örn: "DOMATES SERA" → "DOMATES" key'ini bul)
  const firstWord = normalized.split(' ')[0];
  if (NAME_MAP[firstWord]) return NAME_MAP[firstWord];

  // İki kelime eşleşmesi (örn: "DENİZ BÖRÜLCESİ")
  const twoWords = normalized.split(' ').slice(0, 2).join(' ');
  if (NAME_MAP[twoWords]) return NAME_MAP[twoWords];

  return null;
}

function getPopularityScore(malAdi: string): number {
  const normalized = normalizeSpaces(malAdi).toUpperCase();
  for (let i = 0; i < POPULAR_KEYWORDS.length; i++) {
    if (normalized.startsWith(POPULAR_KEYWORDS[i])) return i;
  }
  return 999;
}

function prettifyName(malAdi: string): string {
  // "DOMATES  SERA" → "Domates Sera"
  return normalizeSpaces(malAdi)
    .split(' ')
    .map(w => {
      if (w.length === 0) return '';
      // Türkçe büyük-küçük harf dönüşümü
      const lower = w.toLowerCase()
        .replace(/i̇/g, 'i') // combining dot above kaldır
        .replace(/İ/g, 'i');
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

async function fetchHalData(dateStr: string): Promise<HalItem[]> {
  try {
    const res = await axios.get<HalResponse>(`${IZMIR_HAL_API}/${dateStr}`, {
      timeout: 10000,
    });
    return res.data?.HalFiyatListesi || [];
  } catch {
    return [];
  }
}

export async function fetchRealHalPrices(): Promise<TransformedPrice[]> {
  const now = Date.now();

  // Cache hâlâ geçerliyse döndür
  if (cachedPrices.length > 0 && (now - cacheTime) < CACHE_TTL) {
    return cachedPrices;
  }

  try {
    const today = new Date();

    // Bugünden geriye 5 gün dene (hafta sonu / tatil günleri için)
    let mainItems: HalItem[] = [];
    let mainDateStr = '';
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const items = await fetchHalData(dateStr);
      if (items.length > 0) {
        mainItems = items;
        mainDateStr = dateStr;
        break;
      }
    }

    // Önceki günü bul (karşılaştırma verisi)
    let compareItems: HalItem[] = [];
    if (mainDateStr) {
      const mainDate = new Date(mainDateStr);
      for (let i = 1; i <= 5; i++) {
        const d = new Date(mainDate);
        d.setDate(d.getDate() - i);
        const items = await fetchHalData(formatDate(d));
        if (items.length > 0) {
          compareItems = items;
          break;
        }
      }
    }

    if (mainItems.length === 0) {
      return cachedPrices; // Fallback eski cache'e
    }

    // Dünkü fiyat map'i oluştur
    const prevPriceMap = new Map<string, number>();
    for (const item of compareItems) {
      const key = normalizeSpaces(item.MalAdi).toUpperCase();
      prevPriceMap.set(key, item.OrtalamaUcret);
    }

    // Popülerliğe göre sırala
    const sorted = [...mainItems].sort((a, b) => {
      return getPopularityScore(a.MalAdi) - getPopularityScore(b.MalAdi);
    });

    // Aynı ana ürünü tekrar eklememek için
    const seenBase = new Set<string>();
    const result: TransformedPrice[] = [];

    for (const item of sorted) {
      const baseKey = getBaseKey(item.MalAdi);

      // Aynı temel üründen birden fazla ekleme (ilk bulunanı al)
      if (seenBase.has(baseKey)) continue;
      seenBase.add(baseKey);

      const translation = findTranslation(item.MalAdi);
      const normalizedName = normalizeSpaces(item.MalAdi).toUpperCase();
      const prevPrice = prevPriceMap.get(normalizedName) || 0;
      const change = prevPrice > 0
        ? ((item.OrtalamaUcret - prevPrice) / prevPrice) * 100
        : 0;

      const unit = item.Birim === 'ADET' ? '₺/ad' : '₺/kg';

      result.push({
        name: prettifyName(item.MalAdi),
        nameEn: translation?.en || prettifyName(item.MalAdi),
        price: item.OrtalamaUcret,
        previousPrice: prevPrice,
        change: Math.round(change * 10) / 10,
        unit,
        category: translation?.category || (item.MalTipAdi === 'MEYVE' ? 'meyve' : 'sebze'),
        minPrice: item.AsgariUcret,
        maxPrice: item.AzamiUcret,
        malTipi: item.MalTipAdi,
        updatedAt: mainDateStr,
      });

      if (result.length >= 30) break;
    }

    cachedPrices = result;
    cacheTime = now;
    return result;
  } catch (error) {
    console.error('Hal fiyatları çekilemedi:', error);
    return cachedPrices;
  }
}

// Tüm ürünler — limit yok, sub-varyantlar ayrı
export async function fetchAllHalPrices(): Promise<TransformedPrice[]> {
  const now = Date.now();

  if (cachedAllPrices.length > 0 && (now - cacheAllTime) < CACHE_TTL) {
    return cachedAllPrices;
  }

  try {
    const today = new Date();

    // Bugünden geriye 5 gün dene
    let mainItems: HalItem[] = [];
    let mainDateStr = '';
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const items = await fetchHalData(dateStr);
      if (items.length > 0) {
        mainItems = items;
        mainDateStr = dateStr;
        break;
      }
    }

    // Karşılaştırma verisi
    let compareItems: HalItem[] = [];
    if (mainDateStr) {
      const mainDate = new Date(mainDateStr);
      for (let i = 1; i <= 5; i++) {
        const d = new Date(mainDate);
        d.setDate(d.getDate() - i);
        const items = await fetchHalData(formatDate(d));
        if (items.length > 0) {
          compareItems = items;
          break;
        }
      }
    }

    if (mainItems.length === 0) return cachedAllPrices;

    const prevPriceMap = new Map<string, number>();
    for (const item of compareItems) {
      const key = normalizeSpaces(item.MalAdi).toUpperCase();
      prevPriceMap.set(key, item.OrtalamaUcret);
    }

    const result: TransformedPrice[] = mainItems.map(item => {
      const translation = findTranslation(item.MalAdi);
      const normalizedName = normalizeSpaces(item.MalAdi).toUpperCase();
      const prevPrice = prevPriceMap.get(normalizedName) || 0;
      const change = prevPrice > 0
        ? ((item.OrtalamaUcret - prevPrice) / prevPrice) * 100
        : 0;
      const unit = item.Birim === 'ADET' ? '₺/ad' : '₺/kg';

      return {
        name: prettifyName(item.MalAdi),
        nameEn: translation?.en || prettifyName(item.MalAdi),
        price: item.OrtalamaUcret,
        previousPrice: prevPrice,
        change: Math.round(change * 10) / 10,
        unit,
        category: translation?.category || (item.MalTipAdi === 'MEYVE' ? 'meyve' : 'sebze'),
        minPrice: item.AsgariUcret,
        maxPrice: item.AzamiUcret,
        malTipi: item.MalTipAdi,
        updatedAt: mainDateStr,
      };
    });

    cachedAllPrices = result;
    cacheAllTime = now;
    return result;
  } catch (error) {
    console.error('Tüm hal fiyatları çekilemedi:', error);
    return cachedAllPrices;
  }
}

// Haftalık fiyat verileri — 7 gün
interface WeeklyDayData {
  date: string;
  prices: { name: string; min: number; max: number; avg: number }[];
}

export async function fetchWeeklyPrices(product?: string): Promise<WeeklyDayData[]> {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }

  const allDayItems = await Promise.all(dates.map(d => fetchHalData(d)));

  const result: WeeklyDayData[] = [];
  for (let i = 0; i < dates.length; i++) {
    const items = allDayItems[i];
    if (items.length === 0) continue;

    let filtered = items;
    if (product) {
      filtered = items.filter(it =>
        normalizeSpaces(it.MalAdi).toUpperCase().includes(product.toUpperCase())
      );
    }

    const prices = filtered.map(it => ({
      name: prettifyName(it.MalAdi),
      min: it.AsgariUcret,
      max: it.AzamiUcret,
      avg: it.OrtalamaUcret,
    }));

    result.push({ date: dates[i], prices });
  }

  return result;
}
