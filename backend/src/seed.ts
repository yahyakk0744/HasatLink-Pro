import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import MarketPrice from './models/MarketPrice';
import User from './models/User';
import Listing from './models/Listing';
import Rating from './models/Rating';
import Notification from './models/Notification';

dotenv.config();

// ── Kullanıcılar ──
const users = [
  {
    userId: 'admin_001',
    name: 'Mehmet Yılmaz',
    email: 'admin@hasatlink.com',
    password: 'admin123',
    location: 'Ceyhan, Adana',
    phone: '05551234567',
    isVerified: true,
    bio: 'HasatLink kurucusu. 15 yıldır Çukurova bölgesinde tarım sektöründe faaliyet gösteriyorum.',
    averageRating: 4.7,
    totalRatings: 12,
  },
  {
    userId: 'user_002',
    name: 'Ayşe Kaya',
    email: 'ayse@hasatlink.com',
    password: 'test123',
    location: 'Tarsus, Mersin',
    phone: '05559876543',
    isVerified: true,
    bio: 'Organik sebze üreticisi. Sera ve açık alan tarımı yapıyorum.',
    averageRating: 4.5,
    totalRatings: 8,
  },
  {
    userId: 'user_003',
    name: 'Ali Demir',
    email: 'ali@hasatlink.com',
    password: 'test123',
    location: 'Kozan, Adana',
    phone: '05553456789',
    isVerified: false,
    bio: 'Lojistik firması sahibi. TIR ve kamyon filosu ile hizmet veriyorum.',
    averageRating: 4.2,
    totalRatings: 5,
  },
  {
    userId: 'user_004',
    name: 'Fatma Çelik',
    email: 'fatma@hasatlink.com',
    password: 'test123',
    location: 'Yüreğir, Adana',
    phone: '05557891234',
    isVerified: true,
    bio: 'Tarım ekipmanları bayisi. John Deere ve New Holland yetkili servisi.',
    averageRating: 4.8,
    totalRatings: 15,
  },
];

// ── İlanlar ──
const listings = [
  // PAZAR
  {
    userId: 'admin_001', type: 'pazar', subCategory: 'MEYVE', status: 'active',
    title: 'Taze Portakal - Washington Çeşidi',
    description: 'Ceyhan bölgesinden taze hasat edilmiş Washington portakalı. 1. sınıf kalite, organik sertifikalı.',
    price: 18, amount: 5000, unit: 'kg', location: 'Ceyhan, Adana',
    coordinates: { lat: 37.0247, lng: 35.8176 }, phone: '05551234567',
    isOrganic: true, qualityGrade: '1. SINIF', storageType: 'SOĞUK HAVA DEPOSU',
    harvestDate: '2026-02-15', minOrderAmount: 500,
    stats: { views: 342, whatsappClicks: 28, shares: 12 },
  },
  {
    userId: 'user_002', type: 'pazar', subCategory: 'SEBZE', status: 'active',
    title: 'Organik Domates - Sera Üretimi',
    description: 'Sera ortamında yetiştirilen organik domates. Günlük taze hasat.',
    price: 35, amount: 2000, unit: 'kg', location: 'Tarsus, Mersin',
    coordinates: { lat: 36.9157, lng: 34.8930 }, phone: '05559876543',
    isOrganic: true, qualityGrade: '1. SINIF', storageType: 'SERA',
    harvestDate: '2026-02-27', minOrderAmount: 100,
    stats: { views: 567, whatsappClicks: 45, shares: 23 },
  },
  {
    userId: 'admin_001', type: 'pazar', subCategory: 'TAHIL', status: 'active',
    title: 'Buğday - Ceyhan Ovası Üretimi',
    description: 'Ceyhan Ovası\'nda yetiştirilen yüksek kalite buğday. Teslimata hazır.',
    price: 12.5, amount: 50000, unit: 'ton', location: 'Ceyhan, Adana',
    coordinates: { lat: 37.0300, lng: 35.8200 }, phone: '05551234567',
    qualityGrade: 'STANDART', storageType: 'KURU DEPO', minOrderAmount: 1000,
    stats: { views: 189, whatsappClicks: 15, shares: 8 },
  },
  {
    userId: 'user_002', type: 'pazar', subCategory: 'SEBZE', status: 'sold',
    title: 'Taze Biber - Kapya Çeşidi',
    description: 'Tarsus bölgesinden taze kapya biber.',
    price: 42, amount: 1500, unit: 'kg', location: 'Tarsus, Mersin',
    coordinates: { lat: 36.9100, lng: 34.8900 }, phone: '05559876543',
    qualityGrade: '1. SINIF', storageType: 'AÇIK ALAN',
    stats: { views: 423, whatsappClicks: 38, shares: 15 },
  },
  // LOJİSTİK
  {
    userId: 'user_003', type: 'lojistik', subCategory: 'TIR', status: 'active',
    title: 'Adana-İstanbul TIR Nakliye',
    description: 'Adana\'dan İstanbul\'a sebze-meyve taşımacılığı. Frigo araç mevcuttur.',
    price: 45000, location: 'Adana',
    coordinates: { lat: 37.0000, lng: 35.3213 }, phone: '05553456789',
    isFrigo: true, vehicleType: 'TIR (TIRLI)', capacity: 25,
    routeFrom: 'Adana', routeTo: 'İstanbul',
    availableDate: '2026-03-01', hasInsurance: true, plateNumber: '01 ABC 123',
    stats: { views: 234, whatsappClicks: 19, shares: 7 },
  },
  {
    userId: 'user_003', type: 'lojistik', subCategory: 'KAMYONET', status: 'active',
    title: 'Mersin-Ankara Soğuk Zincir Taşıma',
    description: 'Mersin halinden Ankara toptancılarına frigo kamyonet ile taşıma.',
    price: 18000, location: 'Mersin',
    coordinates: { lat: 36.8121, lng: 34.6415 }, phone: '05553456789',
    isFrigo: true, vehicleType: 'FRİGO KAMYON', capacity: 8,
    routeFrom: 'Mersin', routeTo: 'Ankara',
    availableDate: '2026-03-05', hasInsurance: true,
    stats: { views: 156, whatsappClicks: 12, shares: 5 },
  },
  // İŞGÜCÜ
  {
    userId: 'admin_001', type: 'isgucu', subCategory: 'HASAT EKİBİ', status: 'active',
    title: 'Portakal Hasat Ekibi - 10 Kişi',
    description: 'Deneyimli portakal hasat ekibi. Günlük 5 ton hasat kapasitesi.',
    price: 25000, location: 'Ceyhan, Adana',
    coordinates: { lat: 37.0247, lng: 35.8176 }, phone: '05551234567',
    isTeam: true, workerCount: 10, experienceYears: 8,
    dailyWage: 1200, skills: ['HASAT', 'BUDAMA'],
    stats: { views: 98, whatsappClicks: 8, shares: 3 },
  },
  {
    userId: 'user_002', type: 'isgucu', subCategory: 'İLAÇLAMA EKİBİ', status: 'active',
    title: 'Dron ile İlaçlama Hizmeti',
    description: 'Profesyonel tarım dronu ile ilaçlama. Dekar başı fiyatlandırma.',
    price: 150, location: 'Tarsus, Mersin',
    coordinates: { lat: 36.9157, lng: 34.8930 }, phone: '05559876543',
    workerCount: 2, experienceYears: 3,
    dailyWage: 3500, skills: ['DRON KULLANIMI', 'İLAÇLAMA'],
    stats: { views: 312, whatsappClicks: 25, shares: 18 },
  },
  // EKİPMAN
  {
    userId: 'user_004', type: 'ekipman', subCategory: 'TRAKTÖR', status: 'active',
    title: 'John Deere 6130R - 2023 Model',
    description: '2023 model John Deere 6130R traktör. 130 HP, klimalı kabin, 450 saatte.',
    price: 4500000, location: 'Yüreğir, Adana',
    coordinates: { lat: 36.9956, lng: 35.3530 }, phone: '05557891234',
    brand: 'JOHN DEERE', modelName: '6130R', yearOfManufacture: 2023,
    condition: 'İKİNCİ EL - İYİ', horsePower: 130, saleType: 'SATILIK',
    stats: { views: 876, whatsappClicks: 67, shares: 34 },
  },
  {
    userId: 'user_004', type: 'ekipman', subCategory: 'DRON', status: 'active',
    title: 'DJI Agras T40 Tarım Dronu - Kiralık',
    description: 'DJI Agras T40 tarım dronu. 40 litre tank, 20 dönüm/saat kapasite.',
    price: 5000, location: 'Yüreğir, Adana',
    coordinates: { lat: 36.9956, lng: 35.3530 }, phone: '05557891234',
    brand: 'DİĞER', modelName: 'DJI Agras T40', yearOfManufacture: 2024,
    condition: 'SIFIR', saleType: 'KİRALIK', rentType: 'GÜNLÜK',
    stats: { views: 543, whatsappClicks: 42, shares: 27 },
  },
  {
    userId: 'user_004', type: 'ekipman', subCategory: 'SULAMA SİSTEMİ', status: 'active',
    title: 'Damlama Sulama Sistemi - 50 Dönüm',
    description: 'Komple damlama sulama sistemi. Pompa, filtre, borular dahil. 50 dönüm kapasiteli.',
    price: 85000, location: 'Yüreğir, Adana',
    coordinates: { lat: 36.9956, lng: 35.3530 }, phone: '05557891234',
    brand: 'DİĞER', condition: 'SIFIR', saleType: 'SATILIK',
    stats: { views: 234, whatsappClicks: 18, shares: 9 },
  },
  {
    userId: 'admin_001', type: 'pazar', subCategory: 'FİDE', status: 'active',
    title: 'Domates Fidesi - 10.000 Adet',
    description: 'Sera tipi domates fidesi. Hastalığa dayanıklı F1 hibrit çeşit.',
    price: 5, amount: 10000, unit: 'adet', location: 'Ceyhan, Adana',
    coordinates: { lat: 37.0247, lng: 35.8176 }, phone: '05551234567',
    qualityGrade: 'ÖZEL', storageType: 'SERA',
    stats: { views: 178, whatsappClicks: 14, shares: 6 },
  },
  // ARAZİ
  {
    userId: 'admin_001', type: 'arazi', listingMode: 'sell', subCategory: 'TARLA', status: 'active',
    title: 'Verimli Tarla - 50 Dönüm Ceyhan',
    description: 'Ceyhan Ovası\'nda sulama kanalına yakın verimli tarla. Tapulu, sulanabilir arazi.',
    price: 2500000, location: 'Ceyhan, Adana',
    coordinates: { lat: 37.0300, lng: 35.8200 }, phone: '05551234567',
    landSize: 50, landUnit: 'dönüm', soilType: 'VERİMLİ',
    waterAvailable: true, hasElectricity: true,
    deedStatus: 'TAPU', zoningStatus: 'TARIM',
    stats: { views: 215, whatsappClicks: 18, shares: 9 },
  },
  {
    userId: 'user_002', type: 'arazi', listingMode: 'buy', subCategory: 'SERA ALANI', status: 'active',
    title: 'Sera Alanı Kiralık - 10 Dönüm Tarsus',
    description: 'Tarsus\'ta sera kuruluma uygun arazi. Elektrik ve su mevcut.',
    price: 120000, location: 'Tarsus, Mersin',
    coordinates: { lat: 36.9157, lng: 34.8930 }, phone: '05559876543',
    landSize: 10, landUnit: 'dönüm', soilType: 'VERİMLİ',
    waterAvailable: true, hasElectricity: true,
    deedStatus: 'TAPU', zoningStatus: 'TARIM', rentDuration: 'YILLIK',
    stats: { views: 187, whatsappClicks: 14, shares: 6 },
  },
  {
    userId: 'user_003', type: 'arazi', listingMode: 'sell', subCategory: 'ZEYTİNLİK', status: 'active',
    title: 'Zeytinlik Satılık - 30 Dönüm',
    description: '200 ağaçlı verimli zeytinlik. Yılda ortalama 5 ton zeytin verimi.',
    price: 4500000, location: 'Kozan, Adana',
    coordinates: { lat: 37.4500, lng: 35.8100 }, phone: '05553456789',
    landSize: 30, landUnit: 'dönüm', soilType: 'VERİMLİ',
    waterAvailable: true, hasElectricity: false,
    deedStatus: 'TAPU', zoningStatus: 'TARIM',
    stats: { views: 342, whatsappClicks: 27, shares: 14 },
  },
  // DEPOLAMA
  {
    userId: 'user_004', type: 'depolama', listingMode: 'sell', subCategory: 'SOĞUK HAVA DEPOSU', status: 'active',
    title: 'Soğuk Hava Deposu - 500 Ton Kapasite',
    description: '500 ton kapasiteli soğuk hava deposu. -5°C ile +10°C arası ayarlanabilir sıcaklık. 7/24 güvenlik.',
    price: 8500000, location: 'Yüreğir, Adana',
    coordinates: { lat: 36.9956, lng: 35.3530 }, phone: '05557891234',
    storageCapacity: 500, storageCapacityUnit: 'ton',
    temperatureMin: -5, temperatureMax: 10,
    hasSecurity: true, has24Access: true,
    stats: { views: 456, whatsappClicks: 35, shares: 19 },
  },
  {
    userId: 'admin_001', type: 'depolama', listingMode: 'buy', subCategory: 'KURU DEPO', status: 'active',
    title: 'Kiralık Kuru Depo - Ceyhan',
    description: 'Tahıl depolama için uygun kuru depo. 1000 m³ kapasite, güvenlikli.',
    price: 45000, location: 'Ceyhan, Adana',
    coordinates: { lat: 37.0247, lng: 35.8176 }, phone: '05551234567',
    storageCapacity: 1000, storageCapacityUnit: 'm³',
    temperatureMin: 10, temperatureMax: 30,
    hasSecurity: true, has24Access: false, rentDuration: 'AYLIK',
    stats: { views: 128, whatsappClicks: 10, shares: 4 },
  },
  {
    userId: 'user_002', type: 'depolama', listingMode: 'buy', subCategory: 'TAHIL SİLOSU', status: 'active',
    title: 'Tahıl Silosu Kiralık - 200 Ton',
    description: 'Buğday ve arpa depolama için uygun tahıl silosu. Havalandırma sistemi mevcut.',
    price: 35000, location: 'Tarsus, Mersin',
    coordinates: { lat: 36.9157, lng: 34.8930 }, phone: '05559876543',
    storageCapacity: 200, storageCapacityUnit: 'ton',
    temperatureMin: 15, temperatureMax: 25,
    hasSecurity: true, has24Access: true, rentDuration: 'YILLIK',
    stats: { views: 95, whatsappClicks: 7, shares: 3 },
  },
];

// ── Puanlar ve Yorumlar ──
const ratings = [
  { fromUserId: 'user_002', toUserId: 'admin_001', score: 5, comment: 'Çok kaliteli portakal, tekrar alacağım kesinlikle. Teşekkürler Mehmet Bey!', fromUserName: 'Ayşe Kaya' },
  { fromUserId: 'user_003', toUserId: 'admin_001', score: 4, comment: 'Buğday kalitesi iyi, teslimat zamanında yapıldı.', fromUserName: 'Ali Demir' },
  { fromUserId: 'user_004', toUserId: 'admin_001', score: 5, comment: 'Hasat ekibi çok profesyonel çalıştı. Tavsiye ederim.', fromUserName: 'Fatma Çelik' },
  { fromUserId: 'admin_001', toUserId: 'user_002', score: 5, comment: 'Organik domatesler muhteşemdi! Sera üretimi gerçekten fark yaratıyor.', fromUserName: 'Mehmet Yılmaz' },
  { fromUserId: 'user_003', toUserId: 'user_002', score: 4, comment: 'Güzel ürünler, paketleme biraz daha iyi olabilir.', fromUserName: 'Ali Demir' },
  { fromUserId: 'user_004', toUserId: 'user_002', score: 5, comment: 'Dron ilaçlama hizmeti mükemmeldi. Çok hızlı ve etkili.', fromUserName: 'Fatma Çelik' },
  { fromUserId: 'admin_001', toUserId: 'user_003', score: 4, comment: 'Nakliye zamanında yapıldı, frigo araç temizdi.', fromUserName: 'Mehmet Yılmaz' },
  { fromUserId: 'user_002', toUserId: 'user_003', score: 5, comment: 'Mersin-Ankara hattında en güvenilir nakliyeci.', fromUserName: 'Ayşe Kaya' },
  { fromUserId: 'admin_001', toUserId: 'user_004', score: 5, comment: 'John Deere traktör mükemmel durumda, Fatma Hanım çok yardımcı oldu.', fromUserName: 'Mehmet Yılmaz' },
  { fromUserId: 'user_002', toUserId: 'user_004', score: 5, comment: 'Dron kiralama hizmeti süper! Tekrar kiralamayı düşünüyorum.', fromUserName: 'Ayşe Kaya' },
  { fromUserId: 'user_003', toUserId: 'user_004', score: 4, comment: 'Ekipman kalitesi çok iyi, fiyatlar da makul.', fromUserName: 'Ali Demir' },
  { fromUserId: 'user_004', toUserId: 'admin_001', score: 5, comment: 'Fide kalitesi harika, tamamı tuttu. Mehmet Bey teşekkürler!', fromUserName: 'Fatma Çelik' },
];

// ── Bildirimler ──
const notifications = [
  { userId: 'admin_001', type: 'borsa', title: 'Domates fiyatı yükseldi!', message: 'Domates hal fiyatı %8.3 artarak 32.50 ₺/kg oldu.' },
  { userId: 'admin_001', type: 'istatistik', title: 'İlanınız popüler!', message: 'Portakal ilanınız bu hafta 150 kez görüntülendi.' },
  { userId: 'admin_001', type: 'rating', title: 'Yeni yorum aldınız', message: 'Ayşe Kaya size 5 yıldız verdi: "Çok kaliteli portakal!"' },
  { userId: 'admin_001', type: 'sistem', title: 'Hoş geldiniz!', message: 'HasatLink\'e hoş geldiniz! Profilinizi tamamlayarak daha fazla alıcıya ulaşın.' },
  { userId: 'admin_001', type: 'hava', title: 'Don uyarısı!', message: 'Ceyhan bölgesinde yarın gece don bekleniyor. Fidelerinizi koruma altına alın.' },
  { userId: 'admin_001', type: 'ilan', title: 'İlanınızla ilgileniliyor', message: 'Buğday ilanınız için 3 yeni WhatsApp mesajı aldınız.' },
];

// ── Hal Fiyatları ──
const marketPrices = [
  { name: 'Domates', nameEn: 'Tomato', price: 32.50, previousPrice: 30.00, change: 8.33, unit: '₺/kg', category: 'sebze' },
  { name: 'Biber', nameEn: 'Pepper', price: 45.00, previousPrice: 48.00, change: -6.25, unit: '₺/kg', category: 'sebze' },
  { name: 'Patlıcan', nameEn: 'Eggplant', price: 28.00, previousPrice: 25.50, change: 9.80, unit: '₺/kg', category: 'sebze' },
  { name: 'Salatalık', nameEn: 'Cucumber', price: 22.00, previousPrice: 24.00, change: -8.33, unit: '₺/kg', category: 'sebze' },
  { name: 'Soğan', nameEn: 'Onion', price: 18.50, previousPrice: 17.00, change: 8.82, unit: '₺/kg', category: 'sebze' },
  { name: 'Patates', nameEn: 'Potato', price: 15.00, previousPrice: 14.50, change: 3.45, unit: '₺/kg', category: 'sebze' },
  { name: 'Portakal', nameEn: 'Orange', price: 20.00, previousPrice: 22.00, change: -9.09, unit: '₺/kg', category: 'meyve' },
  { name: 'Limon', nameEn: 'Lemon', price: 35.00, previousPrice: 32.00, change: 9.38, unit: '₺/kg', category: 'meyve' },
  { name: 'Elma', nameEn: 'Apple', price: 25.00, previousPrice: 26.00, change: -3.85, unit: '₺/kg', category: 'meyve' },
  { name: 'Buğday', nameEn: 'Wheat', price: 12.80, previousPrice: 12.00, change: 6.67, unit: '₺/kg', category: 'tahıl' },
  { name: 'Arpa', nameEn: 'Barley', price: 10.50, previousPrice: 11.00, change: -4.55, unit: '₺/kg', category: 'tahıl' },
  { name: 'Mısır', nameEn: 'Corn', price: 11.20, previousPrice: 10.80, change: 3.70, unit: '₺/kg', category: 'tahıl' },
  { name: 'Pamuk', nameEn: 'Cotton', price: 42.00, previousPrice: 40.00, change: 5.00, unit: '₺/kg', category: 'endüstriyel' },
  { name: 'Ayçiçeği', nameEn: 'Sunflower', price: 28.50, previousPrice: 27.00, change: 5.56, unit: '₺/kg', category: 'endüstriyel' },
  { name: 'Soya', nameEn: 'Soybean', price: 22.00, previousPrice: 23.50, change: -6.38, unit: '₺/kg', category: 'endüstriyel' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hasatlink');
    console.log('MongoDB connected for seeding');

    // Temizle
    await Promise.all([
      User.deleteMany({}),
      Listing.deleteMany({}),
      Rating.deleteMany({}),
      Notification.deleteMany({}),
      MarketPrice.deleteMany({}),
    ]);
    console.log('All collections cleared');

    // Kullanıcıları oluştur (şifreleri hash'le)
    for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({ ...u, password: hashedPassword });
    }
    console.log(`✓ ${users.length} kullanıcı oluşturuldu`);

    // İlanları oluştur
    await Listing.insertMany(listings);
    console.log(`✓ ${listings.length} ilan oluşturuldu`);

    // Puanları oluştur
    await Rating.insertMany(ratings);
    console.log(`✓ ${ratings.length} puan/yorum oluşturuldu`);

    // Bildirimleri oluştur
    await Notification.insertMany(notifications);
    console.log(`✓ ${notifications.length} bildirim oluşturuldu`);

    // Hal fiyatlarını oluştur
    await MarketPrice.insertMany(marketPrices);
    console.log(`✓ ${marketPrices.length} hal fiyatı oluşturuldu`);

    console.log('\n═══════════════════════════════════════');
    console.log('  SEED TAMAMLANDI!');
    console.log('═══════════════════════════════════════');
    console.log('  Admin Giriş:');
    console.log('    Email: admin@hasatlink.com');
    console.log('    Şifre: admin123');
    console.log('');
    console.log('  Diğer Kullanıcılar (şifre: test123):');
    console.log('    ayse@hasatlink.com');
    console.log('    ali@hasatlink.com');
    console.log('    fatma@hasatlink.com');
    console.log('═══════════════════════════════════════\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
