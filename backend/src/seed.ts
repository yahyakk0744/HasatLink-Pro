import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MarketPrice from './models/MarketPrice';
import User from './models/User';
import Listing from './models/Listing';
import Rating from './models/Rating';
import Notification from './models/Notification';
import AIDiagnosis from './models/AIDiagnosis';

dotenv.config();

// ── Hal Fiyatları (başlangıç verisi) ──
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

    // Tüm collection'ları temizle
    await Promise.all([
      User.deleteMany({}),
      Listing.deleteMany({}),
      Rating.deleteMany({}),
      Notification.deleteMany({}),
      AIDiagnosis.deleteMany({}),
      MarketPrice.deleteMany({}),
    ]);
    console.log('✓ Tüm collection\'lar temizlendi');

    // Sadece hal fiyatlarını ekle
    await MarketPrice.insertMany(marketPrices);
    console.log(`✓ ${marketPrices.length} hal fiyatı oluşturuldu`);

    console.log('\n═══════════════════════════════════════');
    console.log('  SEED TAMAMLANDI!');
    console.log('  Veritabanı temizlendi.');
    console.log('  Sadece başlangıç hal fiyatları eklendi.');
    console.log('═══════════════════════════════════════\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
