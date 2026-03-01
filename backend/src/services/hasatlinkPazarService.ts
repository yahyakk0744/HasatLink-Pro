import Listing from '../models/Listing';

export interface HasatlinkPazarItem {
  name: string;
  category: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  change: number;
  unit: string;
  listingCount: number;
  updatedAt: string;
}

export interface HasatlinkWeeklyDay {
  date: string;
  prices: { name: string; min: number; max: number; avg: number }[];
}

// In-memory cache
let cachedPrices: HasatlinkPazarItem[] = [];
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 dakika

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Aktif pazar ilanlarından ürün bazlı fiyat istatistiklerini hesapla
 */
export async function fetchHasatlinkPazarPrices(): Promise<HasatlinkPazarItem[]> {
  const now = Date.now();
  if (cachedPrices.length > 0 && (now - cacheTime) < CACHE_TTL) {
    return cachedPrices;
  }

  try {
    // Son 30 gündeki aktif pazar ilanlarını çek
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const listings = await Listing.find({
      type: 'pazar',
      status: 'active',
      price: { $gt: 0 },
    }).sort({ createdAt: -1 }).lean();

    if (listings.length === 0) return cachedPrices;

    // Son 7 günlük ilanlar (güncel fiyat hesabı için)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Önceki 7 gün (değişim hesabı için)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // subCategory bazında grupla
    const currentMap = new Map<string, { prices: number[]; units: string[]; category: string }>();
    const previousMap = new Map<string, { prices: number[] }>();

    for (const listing of listings) {
      const key = listing.subCategory || listing.title?.split(' ')[0] || 'Diğer';
      if (key === 'HEPSİ' || !key) continue;

      const createdAt = new Date(listing.createdAt);

      if (createdAt >= sevenDaysAgo) {
        // Güncel dönem
        if (!currentMap.has(key)) {
          currentMap.set(key, { prices: [], units: [], category: listing.subCategory || '' });
        }
        const entry = currentMap.get(key)!;
        entry.prices.push(listing.price);
        if (listing.unit && !entry.units.includes(listing.unit)) {
          entry.units.push(listing.unit);
        }
      } else if (createdAt >= fourteenDaysAgo) {
        // Önceki dönem
        if (!previousMap.has(key)) {
          previousMap.set(key, { prices: [] });
        }
        previousMap.get(key)!.prices.push(listing.price);
      }
    }

    // Eğer son 7 günde veri yoksa tüm aktif ilanları kullan
    if (currentMap.size === 0) {
      for (const listing of listings) {
        const key = listing.subCategory || listing.title?.split(' ')[0] || 'Diğer';
        if (key === 'HEPSİ' || !key) continue;

        if (!currentMap.has(key)) {
          currentMap.set(key, { prices: [], units: [], category: listing.subCategory || '' });
        }
        const entry = currentMap.get(key)!;
        entry.prices.push(listing.price);
        if (listing.unit && !entry.units.includes(listing.unit)) {
          entry.units.push(listing.unit);
        }
      }
    }

    const result: HasatlinkPazarItem[] = [];

    for (const [name, data] of currentMap) {
      const prices = data.prices;
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const unit = data.units[0] || 'kg';

      // Değişim hesapla
      let change = 0;
      const prev = previousMap.get(name);
      if (prev && prev.prices.length > 0) {
        const prevAvg = prev.prices.reduce((s, p) => s + p, 0) / prev.prices.length;
        if (prevAvg > 0) {
          change = ((avg - prevAvg) / prevAvg) * 100;
        }
      }

      // Kategori belirle — ana kategori ve ürün bazlı eşleştirme
      const PRODUCT_CATEGORY_MAP: Record<string, string> = {
        // MEYVE ürünleri
        'Kayısı': 'meyve', 'Portakal': 'meyve', 'Limon': 'meyve', 'Mandalina': 'meyve',
        'Elma': 'meyve', 'Armut': 'meyve', 'Çilek': 'meyve', 'Kiraz': 'meyve',
        'Vişne': 'meyve', 'Şeftali': 'meyve', 'Üzüm': 'meyve', 'Nar': 'meyve',
        'İncir': 'meyve', 'Karpuz': 'meyve', 'Kavun': 'meyve', 'Muz': 'meyve',
        'Erik': 'meyve', 'Ayva': 'meyve', 'Dut': 'meyve', 'Böğürtlen': 'meyve',
        'Avokado': 'meyve', 'Hurma': 'meyve', 'Kivi': 'meyve', 'Greyfurt': 'meyve', 'Zeytin': 'meyve',
        // SEBZE ürünleri
        'Domates': 'sebze', 'Biber': 'sebze', 'Patlıcan': 'sebze', 'Salatalık': 'sebze',
        'Kabak': 'sebze', 'Soğan': 'sebze', 'Sarımsak': 'sebze', 'Patates': 'sebze',
        'Havuç': 'sebze', 'Ispanak': 'sebze', 'Marul': 'sebze', 'Lahana': 'sebze',
        'Brokoli': 'sebze', 'Karnabahar': 'sebze', 'Fasulye': 'sebze', 'Bezelye': 'sebze',
        'Bamya': 'sebze', 'Turp': 'sebze', 'Kereviz': 'sebze', 'Pırasa': 'sebze',
        'Enginar': 'sebze', 'Semizotu': 'sebze', 'Maydanoz': 'sebze', 'Nane': 'sebze',
        'Dereotu': 'sebze', 'Roka': 'sebze',
        // TAHIL ürünleri
        'Buğday': 'tahıl', 'Arpa': 'tahıl', 'Mısır': 'tahıl', 'Çavdar': 'tahıl',
        'Yulaf': 'tahıl', 'Pirinç': 'tahıl', 'Darı': 'tahıl', 'Tritikale': 'tahıl', 'Sorgum': 'tahıl',
        // PAMUK ürünleri
        'Kütlü Pamuk': 'pamuk', 'Lif Pamuk': 'pamuk', 'Pamuk Tohumu': 'pamuk', 'Çiğit': 'pamuk',
        // GÜBRE ürünleri
        'Üre': 'gübre', 'DAP': 'gübre', 'Amonyum Sülfat': 'gübre', 'Potasyum Sülfat': 'gübre',
        'NPK': 'gübre', 'Kalsiyum Amonyum Nitrat': 'gübre', 'TSP': 'gübre',
        'Organik Gübre': 'gübre', 'Sıvı Gübre': 'gübre',
        // FİDE ürünleri
        'Domates Fidesi': 'fide', 'Biber Fidesi': 'fide', 'Patlıcan Fidesi': 'fide',
        'Salatalık Fidesi': 'fide', 'Kavun Fidesi': 'fide', 'Karpuz Fidesi': 'fide',
        'Marul Fidesi': 'fide', 'Çilek Fidesi': 'fide', 'Meyve Fidanı': 'fide',
        'Zeytin Fidanı': 'fide', 'Narenciye Fidanı': 'fide', 'Ceviz Fidanı': 'fide', 'Bağ Çubuğu': 'fide',
      };

      const parentCatMap: Record<string, string> = {
        'MEYVE': 'meyve', 'SEBZE': 'sebze', 'TAHIL': 'tahıl',
        'PAMUK': 'pamuk', 'GÜBRE': 'gübre', 'FİDE': 'fide',
        'TOHUM': 'tohum', 'BAKLİYAT': 'bakliyat', 'DİĞER': 'diğer',
      };

      const resolvedCategory = PRODUCT_CATEGORY_MAP[name] || parentCatMap[name] || parentCatMap[data.category] || 'diğer';

      result.push({
        name,
        category: resolvedCategory,
        price: Math.round(avg * 100) / 100,
        minPrice: Math.round(min * 100) / 100,
        maxPrice: Math.round(max * 100) / 100,
        change: Math.round(change * 10) / 10,
        unit: `₺/${unit}`,
        listingCount: prices.length,
        updatedAt: formatDate(new Date()),
      });
    }

    // İlan sayısına göre sırala (popülerlik)
    result.sort((a, b) => b.listingCount - a.listingCount);

    cachedPrices = result;
    cacheTime = now;
    return result;
  } catch (error) {
    console.error('HasatLink pazar fiyatları hesaplanamadı:', error);
    return cachedPrices;
  }
}

/**
 * Haftalık fiyat verileri — son 7 gün, subCategory bazında
 */
export async function fetchHasatlinkWeeklyPrices(product?: string): Promise<HasatlinkWeeklyDay[]> {
  try {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(formatDate(d));
    }

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const listings = await Listing.find({
      type: 'pazar',
      status: 'active',
      price: { $gt: 0 },
      createdAt: { $gte: sevenDaysAgo },
    }).lean();

    const result: HasatlinkWeeklyDay[] = [];

    for (const dateStr of dates) {
      // Bu günün ilanlarını filtrele
      const dayListings = listings.filter(l => {
        const created = formatDate(new Date(l.createdAt));
        return created === dateStr;
      });

      if (dayListings.length === 0) {
        result.push({ date: dateStr, prices: [] });
        continue;
      }

      // Ürüne göre filtrele
      let filtered = dayListings;
      if (product) {
        filtered = dayListings.filter(l =>
          (l.subCategory || '').toUpperCase().includes(product.toUpperCase()) ||
          (l.title || '').toUpperCase().includes(product.toUpperCase())
        );
        if (filtered.length === 0) filtered = dayListings;
      }

      // subCategory bazında grupla
      const groupMap = new Map<string, number[]>();
      for (const l of filtered) {
        const key = l.subCategory || l.title?.split(' ')[0] || 'Diğer';
        if (key === 'HEPSİ') continue;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(l.price);
      }

      const prices = Array.from(groupMap).map(([name, priceArr]) => ({
        name,
        min: Math.round(Math.min(...priceArr) * 100) / 100,
        max: Math.round(Math.max(...priceArr) * 100) / 100,
        avg: Math.round((priceArr.reduce((s, p) => s + p, 0) / priceArr.length) * 100) / 100,
      }));

      result.push({ date: dateStr, prices });
    }

    return result;
  } catch (error) {
    console.error('HasatLink haftalık fiyatlar hesaplanamadı:', error);
    return [];
  }
}

/**
 * Saatlik fiyat verileri — bugünün ilanları saat bazında
 */
export interface HasatlinkHourlyData {
  hour: string;
  prices: { name: string; min: number; max: number; avg: number }[];
}

export async function fetchHasatlinkHourlyPrices(product?: string): Promise<HasatlinkHourlyData[]> {
  try {
    const todayStart = startOfDay(new Date());

    const listings = await Listing.find({
      type: 'pazar',
      status: 'active',
      price: { $gt: 0 },
      createdAt: { $gte: todayStart },
    }).lean();

    // 0-23 arası saatler
    const result: HasatlinkHourlyData[] = [];

    for (let h = 0; h <= 23; h++) {
      const hourLabel = `${String(h).padStart(2, '0')}:00`;

      const hourListings = listings.filter(l => {
        const created = new Date(l.createdAt);
        return created.getHours() === h;
      });

      if (hourListings.length === 0) {
        continue; // Boş saatleri atla
      }

      let filtered = hourListings;
      if (product) {
        const f = hourListings.filter(l =>
          (l.subCategory || '').toUpperCase().includes(product.toUpperCase()) ||
          (l.title || '').toUpperCase().includes(product.toUpperCase())
        );
        if (f.length > 0) filtered = f;
      }

      const groupMap = new Map<string, number[]>();
      for (const l of filtered) {
        const key = l.subCategory || l.title?.split(' ')[0] || 'Diğer';
        if (key === 'HEPSİ') continue;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(l.price);
      }

      const prices = Array.from(groupMap).map(([name, priceArr]) => ({
        name,
        min: Math.round(Math.min(...priceArr) * 100) / 100,
        max: Math.round(Math.max(...priceArr) * 100) / 100,
        avg: Math.round((priceArr.reduce((s, p) => s + p, 0) / priceArr.length) * 100) / 100,
      }));

      result.push({ hour: hourLabel, prices });
    }

    return result;
  } catch (error) {
    console.error('HasatLink saatlik fiyatlar hesaplanamadı:', error);
    return [];
  }
}
