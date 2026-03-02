export const CATEGORIES = {
  pazar: ['HEPSİ', 'MEYVE', 'SEBZE', 'TAHIL', 'PAMUK', 'GÜBRE', 'FİDE', 'TOHUM', 'BAKLİYAT', 'DİĞER'],
  lojistik: ['HEPSİ', 'DAMPERLİ', 'TIR', 'SIVI TANKER', 'FRİGO', 'KAMYONET', 'DİĞER'],
  isgucu: ['HEPSİ', 'OPERATÖR', 'İLAÇLAMA EKİBİ', 'İŞÇİ', 'BUDAMACI', 'HASAT EKİBİ', 'OT BİÇME', 'DİĞER'],
  ekipman: ['HEPSİ', 'TRAKTÖR', 'PULLUK', 'DRON', 'İLAÇLAMA MAK.', 'SULAMA SİSTEMİ', 'SERA EKİPMANI', 'BİÇERDÖVER', 'DİĞER'],
  arazi: ['HEPSİ', 'TARLA', 'BAĞ', 'BAHÇE', 'ZEYTİNLİK', 'SERA ALANI', 'MERA', 'DİĞER'],
  depolama: ['HEPSİ', 'SOĞUK HAVA DEPOSU', 'KURU DEPO', 'TAHIL SİLOSU', 'AÇIK DEPO', 'DİĞER'],
} as const;

// Pazar alt kategorileri — detaylı ürün listesi
export const PAZAR_SUBCATEGORIES: Record<string, string[]> = {
  MEYVE: ['Kayısı', 'Portakal', 'Limon', 'Mandalina', 'Elma', 'Armut', 'Çilek', 'Kiraz', 'Vişne', 'Şeftali', 'Üzüm', 'Nar', 'İncir', 'Karpuz', 'Kavun', 'Muz', 'Erik', 'Ayva', 'Dut', 'Böğürtlen', 'Avokado', 'Hurma', 'Kivi', 'Greyfurt', 'Zeytin'],
  SEBZE: ['Domates', 'Biber', 'Patlıcan', 'Salatalık', 'Kabak', 'Soğan', 'Sarımsak', 'Patates', 'Havuç', 'Ispanak', 'Marul', 'Lahana', 'Brokoli', 'Karnabahar', 'Fasulye', 'Bezelye', 'Bamya', 'Turp', 'Kereviz', 'Pırasa', 'Enginar', 'Semizotu', 'Maydanoz', 'Nane', 'Dereotu', 'Roka'],
  TAHIL: ['Buğday', 'Arpa', 'Mısır', 'Çavdar', 'Yulaf', 'Pirinç', 'Darı', 'Tritikale', 'Sorgum'],
  PAMUK: ['Kütlü Pamuk', 'Lif Pamuk', 'Pamuk Tohumu', 'Çiğit'],
  GÜBRE: ['Üre', 'DAP', 'Amonyum Sülfat', 'Potasyum Sülfat', 'NPK', 'Kalsiyum Amonyum Nitrat', 'TSP', 'Organik Gübre', 'Sıvı Gübre'],
  FİDE: [
    'Domates Fidesi', 'Biber Fidesi', 'Patlıcan Fidesi', 'Salatalık Fidesi',
    'Kavun Fidesi', 'Karpuz Fidesi', 'Marul Fidesi', 'Çilek Fidesi',
    'Yaban Mersini Fidesi', 'Ahududu Fidesi', 'Böğürtlen Fidesi', 'Frambuaz Fidesi',
    'Elma Fidanı', 'Armut Fidanı', 'Kiraz Fidanı', 'Şeftali Fidanı', 'Kayısı Fidanı',
    'Vişne Fidanı', 'Erik Fidanı', 'Nar Fidanı', 'İncir Fidanı',
    'Zeytin Fidanı', 'Narenciye Fidanı', 'Ceviz Fidanı', 'Badem Fidanı',
    'Fındık Fidanı', 'Avokado Fidanı', 'Kivi Fidanı', 'Dut Fidanı',
    'Bağ Çubuğu',
  ],
  TOHUM: [
    'Buğday Tohumu', 'Arpa Tohumu', 'Mısır Tohumu', 'Ayçiçeği Tohumu',
    'Pamuk Tohumu', 'Çeltik Tohumu', 'Sebze Tohumu', 'Çim Tohumu',
    'Yonca Tohumu', 'Fiğ Tohumu', 'Korunga Tohumu', 'Sorgum Tohumu',
  ],
  BAKLİYAT: [
    'Nohut', 'Kırmızı Mercimek', 'Yeşil Mercimek', 'Kuru Fasulye',
    'Börülce', 'Bakla', 'Bezelye', 'Soya Fasulyesi', 'Barbunya', 'Maş Fasulyesi',
  ],
};

export const CATEGORY_LABELS: Record<string, { tr: string; en: string; icon: string }> = {
  pazar: { tr: 'PAZAR', en: 'MARKET', icon: '🌾' },
  lojistik: { tr: 'LOJİSTİK', en: 'LOGISTICS', icon: '🚛' },
  isgucu: { tr: 'İŞ GÜCÜ', en: 'WORKFORCE', icon: '👷' },
  ekipman: { tr: 'EKİPMAN', en: 'EQUIPMENT', icon: '🚜' },
  arazi: { tr: 'ARAZİ', en: 'LAND', icon: '🏞️' },
  depolama: { tr: 'DEPOLAMA', en: 'STORAGE', icon: '📦' },
};

export const COLORS = {
  primary: '#2D6A4F',
  orange: '#A47148',
  dark: '#1A1A1A',
  lightBg: '#F5F3EF',
  pageBg: '#FAFAF8',
  textGray: '#6B6560',
  border: '#D6D0C8',
  red: '#C1341B',
  blue: '#0077B6',
};

export const STATUS_LABELS: Record<string, { tr: string; en: string; color: string }> = {
  active: { tr: 'AKTİF', en: 'ACTIVE', color: '#2D6A4F' },
  sold: { tr: 'SATILDI', en: 'SOLD', color: '#C1341B' },
  rented: { tr: 'KİRALANDI', en: 'RENTED', color: '#A47148' },
  closed: { tr: 'KAPALI', en: 'CLOSED', color: '#6B6560' },
};

// Pazar (Market) specific options
export const PAZAR_UNITS = ['kg', 'ton', 'çuval', 'kasa', 'adet', 'dekar', 'dönüm', 'litre'];
export const QUALITY_GRADES = ['1. SINIF', '2. SINIF', 'STANDART', 'ÖZEL'];
export const STORAGE_TYPES = ['SOĞUK HAVA DEPOSU', 'KURU DEPO', 'AÇIK ALAN', 'SERA'];

// Lojistik (Logistics) specific options
export const VEHICLE_TYPES = ['DAMPERLİ KAMYON', 'TIR (TIRLI)', 'SIVI TANKER', 'FRİGO KAMYON', 'KAMYONET', 'AÇIK KASA', 'TENTELI'];

// İşgücü (Workforce) specific options
export const WORKER_SKILLS = ['BİÇER DÖVER KULLANIMI', 'TRAKTÖR KULLANIMI', 'İLAÇLAMA', 'BUDAMA', 'SULAMA', 'HASAT', 'EKİM', 'SERA BAKIMI', 'DRON KULLANIMI', 'OT BİÇME'];

// Ekipman (Equipment) specific options
export const EQUIPMENT_CONDITIONS = ['SIFIR', 'İKİNCİ EL - İYİ', 'İKİNCİ EL - ORTA', 'YENİLENMİŞ'];
export const EQUIPMENT_BRANDS = ['JOHN DEERE', 'NEW HOLLAND', 'MASSEY FERGUSON', 'CASE IH', 'KUBOTA', 'CLAAS', 'DEUTZ-FAHR', 'HATTAT', 'BAŞAK', 'TÜMOSAN', 'ERKUNT', 'DİĞER'];
export const SALE_TYPES = ['SATILIK', 'KİRALIK', 'SATILIK/KİRALIK'];
export const RENT_TYPES = ['GÜNLÜK', 'HAFTALIK', 'AYLIK', 'SEZONLUK'];

// İlan Modu: Satış/Alım etiketleri (kategori bazlı)
export const LISTING_MODE_LABELS: Record<string, Record<string, { tr: string; en: string }>> = {
  pazar: {
    sell: { tr: 'SATIŞ', en: 'SELL' },
    buy:  { tr: 'ALIM', en: 'BUY' },
  },
  lojistik: {
    sell: { tr: 'TEKLİF', en: 'OFFER' },
    buy:  { tr: 'TALEP', en: 'DEMAND' },
  },
  isgucu: {
    sell: { tr: 'TEKLİF', en: 'OFFER' },
    buy:  { tr: 'TALEP', en: 'DEMAND' },
  },
  ekipman: {
    sell: { tr: 'TEKLİF', en: 'OFFER' },
    buy:  { tr: 'TALEP', en: 'DEMAND' },
  },
  arazi: {
    sell: { tr: 'SATILIK', en: 'FOR SALE' },
    buy:  { tr: 'KİRALIK', en: 'FOR RENT' },
  },
  depolama: {
    sell: { tr: 'SATILIK', en: 'FOR SALE' },
    buy:  { tr: 'KİRALIK', en: 'FOR RENT' },
  },
};

export const LISTING_MODE_COLORS: Record<string, string> = {
  sell: '#2D6A4F',
  buy: '#0077B6',
};

// Arazi specific options
export const SOIL_TYPES = ['VERİMLİ', 'KURU', 'KUMLU', 'KİLLİ', 'KARIŞIK'];
export const LAND_UNITS = ['dönüm', 'dekar', 'hektar'];
export const DEED_STATUSES = ['TAPU', 'HİSSELİ TAPU', 'ZİLYETLİK'];
export const ZONING_STATUSES = ['TARIM', 'İMARLI', 'İMARSIZ'];
export const RENT_DURATIONS_ARAZI = ['YILLIK', 'SEZONLUK', '3 YILLIK', '5 YILLIK'];

// Depolama specific options
export const STORAGE_CAPACITY_UNITS = ['ton', 'm³', 'palet'];
export const RENT_DURATIONS_DEPO = ['GÜNLÜK', 'HAFTALIK', 'AYLIK', 'YILLIK'];
