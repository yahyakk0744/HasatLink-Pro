import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SiteSettings from './models/SiteSettings';
import HarvestCalendar from './models/HarvestCalendar';
import LogisticsProvider from './models/LogisticsProvider';

dotenv.config();

// ── Hasat Takvimi Verileri ──
const harvestItems = [
  // Sebzeler
  { product: 'Domates', productEn: 'Tomato', category: 'sebze', plantMonths: [3, 4, 5], harvestMonths: [7, 8, 9, 10], regions: ['Akdeniz', 'Ege', 'Marmara'], description: 'Türkiye\'nin en çok üretilen sebzesi. Sıcak iklim sever, don riskinden korunmalı.', tips: ['Fide dikimi gece sıcaklığı 10°C üzeri olduğunda yapılmalı', 'Düzenli sulama ve destekleme gerekli', 'Yaprak hastalıklarına karşı koruyucu ilaçlama önerilir'] },
  { product: 'Biber', productEn: 'Pepper', category: 'sebze', plantMonths: [3, 4, 5], harvestMonths: [7, 8, 9, 10], regions: ['Akdeniz', 'Ege', 'Güneydoğu Anadolu'], description: 'Çeşitli tipleri olan, sıcak seven sebze. Sera ve açıkta yetiştirilebilir.', tips: ['Toprağın 15°C üzerine çıkmasını bekleyin', 'Meyve tutumu döneminde kalsiyum takviyesi yapın', 'Aşırı sulamadan kaçının'] },
  { product: 'Patlıcan', productEn: 'Eggplant', category: 'sebze', plantMonths: [3, 4, 5], harvestMonths: [6, 7, 8, 9, 10], regions: ['Akdeniz', 'Ege', 'Marmara'], description: 'Sıcak iklim bitkisi, dona hassas. Verimli toprak ve düzenli sulama ister.', tips: ['Don riski geçtikten sonra dikin', 'Solgunluk hastalığına dayanıklı çeşit tercih edin', 'Budama ile verimi artırın'] },
  { product: 'Salatalık', productEn: 'Cucumber', category: 'sebze', plantMonths: [4, 5], harvestMonths: [6, 7, 8, 9], regions: ['Akdeniz', 'Ege', 'Marmara', 'Karadeniz'], description: 'Hızlı büyüyen, bol su isteyen sebze. Sera ve tarlada yetişir.', tips: ['İpe sarma sistemi ile dikey yetiştirme verimi artırır', 'Külleme hastalığına dikkat', 'Günde 2-3 kez hasat kontrolü yapın'] },
  { product: 'Kabak', productEn: 'Zucchini', category: 'sebze', plantMonths: [4, 5], harvestMonths: [6, 7, 8, 9], regions: ['Akdeniz', 'Ege', 'Marmara'], description: 'Kolay yetiştirilen, verimli sebze. Geniş alan ister.', tips: ['Tozlaşma için arı popülasyonunu koruyun', 'Küçükken hasat daha lezzetli olur', 'Küllemeye dikkat edin'] },
  { product: 'Soğan', productEn: 'Onion', category: 'sebze', plantMonths: [2, 3, 10, 11], harvestMonths: [6, 7, 8], regions: ['İç Anadolu', 'Güneydoğu Anadolu', 'Akdeniz'], description: 'Her mutfağın vazgeçilmezi. Kuru iklimde daha iyi sonuç verir.', tips: ['Arpacık soğan Şubat-Mart\'ta dikilir', 'Yapraklar devrildiğinde hasat zamanı gelmiştir', 'Hasattan 2 hafta önce sulamayı kesin'] },
  { product: 'Patates', productEn: 'Potato', category: 'sebze', plantMonths: [3, 4], harvestMonths: [7, 8, 9], regions: ['İç Anadolu', 'Karadeniz', 'Doğu Anadolu'], description: 'Türkiye\'nin temel gıda ürünlerinden. Serin iklimde daha verimli.', tips: ['Sertifikalı tohumluk kullanın', 'Patates böceğine karşı erken müdahale edin', 'Yumru yeşillenmemesi için boğaz doldurma yapın'] },

  // Meyveler
  { product: 'Elma', productEn: 'Apple', category: 'meyve', plantMonths: [2, 3], harvestMonths: [8, 9, 10], regions: ['İç Anadolu', 'Doğu Anadolu', 'Karadeniz'], description: 'Isparta, Karaman ve Niğde başlıca üretim merkezleri.', tips: ['Seyreltme ile meyve kalitesini artırın', 'Elma iç kurdu için feromon tuzak kullanın', 'Hasattan 2 hafta önce sulama kesin'] },
  { product: 'Portakal', productEn: 'Orange', category: 'meyve', plantMonths: [3, 4], harvestMonths: [11, 12, 1, 2], regions: ['Akdeniz'], description: 'Akdeniz ikliminin sembol meyvesi. Mersin, Adana, Hatay, Antalya bölgelerinde yoğun üretim.', tips: ['Don koruması için rüzgar perdeleri oluşturun', 'Akdeniz sineğine karşı tuzak asın', 'Ağaç başına yıllık gübre programı uygulayın'] },
  { product: 'Üzüm', productEn: 'Grape', category: 'meyve', plantMonths: [2, 3], harvestMonths: [8, 9, 10], regions: ['Ege', 'Akdeniz', 'İç Anadolu', 'Güneydoğu Anadolu'], description: 'Sofralık, kurutmalık ve şaraplık çeşitleri ile Türkiye dünya liderleri arasında.', tips: ['Kış budaması Şubat\'ta yapılmalı', 'Külleme ve mildiyö için zamanında ilaçlama', 'Kurutmalık üzüm için serpme yöntemi kullanın'] },
  { product: 'Fındık', productEn: 'Hazelnut', category: 'meyve', plantMonths: [11, 12, 1, 2], harvestMonths: [8, 9], regions: ['Karadeniz'], description: 'Türkiye dünya fındık üretiminin %70\'ini karşılar. Karadeniz Bölgesi\'ne özgü.', tips: ['Ocak yapısını 4-5 dal ile sınırlayın', 'Külleme ve kokarca böceğine dikkat', 'Hasat zamanlaması çotanak rengine göre yapılır'] },
  { product: 'Çay', productEn: 'Tea', category: 'meyve', plantMonths: [3, 4], harvestMonths: [5, 6, 7, 8, 9, 10], regions: ['Karadeniz'], description: 'Rize başta olmak üzere Doğu Karadeniz\'de yoğun üretim. Yılda 3-4 hasat.', tips: ['İlk sürgün en kaliteli çaydır', 'Budama Şubat-Mart\'ta yapılır', 'Yamaç arazilerde erozyon önlemi alın'] },

  // Tahıllar
  { product: 'Buğday', productEn: 'Wheat', category: 'tahil', plantMonths: [10, 11], harvestMonths: [6, 7], regions: ['İç Anadolu', 'Güneydoğu Anadolu', 'Marmara'], description: 'Türkiye\'nin en önemli tahıl ürünü. Kışlık ve yazlık çeşitleri bulunur.', tips: ['Ekim zamanı toprak nemi kritik', 'Yabancı ot mücadelesini kardeşlenme döneminde yapın', 'Süne zararlısına karşı ilaçlama programı uygulayın'] },
  { product: 'Arpa', productEn: 'Barley', category: 'tahil', plantMonths: [10, 11], harvestMonths: [6, 7], regions: ['İç Anadolu', 'Güneydoğu Anadolu'], description: 'Hayvan yemi ve bira yapımında kullanılır. Buğdaydan daha erken olgunlaşır.', tips: ['Kurak bölgelere uygun çeşit seçin', 'Yaprak hastalıklarına karşı fungisit uygulayın', 'Hasattan 1 hafta önce nem kontrolü yapın'] },
  { product: 'Mısır', productEn: 'Corn', category: 'tahil', plantMonths: [4, 5], harvestMonths: [9, 10], regions: ['Akdeniz', 'Güneydoğu Anadolu', 'Karadeniz'], description: 'İkinci ürün olarak da yetiştirilebilir. Sıcak ve bol su ister.', tips: ['Toprağın 10°C üzerine çıkmasını bekleyin', 'Koçan kurdu için biyolojik mücadele uygulayın', 'Damla sulama su tasarrufu sağlar'] },

  // Baklagiller
  { product: 'Mercimek', productEn: 'Lentil', category: 'baklagil', plantMonths: [10, 11, 3], harvestMonths: [6, 7], regions: ['Güneydoğu Anadolu', 'İç Anadolu'], description: 'Kırmızı ve yeşil mercimek. Kurak alanlarda bile yetişebilir.', tips: ['Ekim derinliği 4-5 cm olmalı', 'Yabancı ot mücadelesi kritik', 'Hasatta tane dökülmesine dikkat'] },
  { product: 'Nohut', productEn: 'Chickpea', category: 'baklagil', plantMonths: [3, 4], harvestMonths: [7, 8], regions: ['İç Anadolu', 'Güneydoğu Anadolu'], description: 'Türk mutfağının vazgeçilmezi. Kurak koşullara dayanıklı.', tips: ['Antraknoz hastalığına dayanıklı çeşit seçin', 'Ekim nöbeti uygulayın', 'Tane nemi %13\'ün altına düşünce hasat edin'] },

  // Hayvancılık
  { product: 'Yonca', productEn: 'Alfalfa', category: 'hayvancilik', plantMonths: [3, 4, 9], harvestMonths: [5, 6, 7, 8, 9, 10], regions: ['İç Anadolu', 'Doğu Anadolu', 'Ege'], description: 'En kaliteli kaba yem bitkisi. Yılda 4-6 biçim alınabilir. Protein değeri yüksek.', tips: ['İlk biçimde %10 çiçeklenme dönemini bekleyin', 'Her biçimden sonra sulama yapın', 'Kış öncesi son biçimi Ekim ortasına kadar yapın'] },
  { product: 'Silajlık Mısır', productEn: 'Silage Corn', category: 'hayvancilik', plantMonths: [4, 5], harvestMonths: [8, 9], regions: ['Akdeniz', 'Marmara', 'Karadeniz'], description: 'Büyükbaş hayvan beslemede temel yem kaynağı. Yüksek enerji değeri.', tips: ['Silaj yapımında kuru madde oranı %30-35 olmalı', 'Silo kapatma hızlı yapılmalı', 'Hamur olum döneminde hasat edin'] },
];

// ── Nakliyeci Verileri ──
const logisticsProviders = [
  { name: 'Ahmet Yılmaz', companyName: 'Yılmaz Nakliyat', phone: '5321234567', whatsapp: '5321234567', city: 'Antalya', district: 'Kepez', vehicleTypes: ['kamyon', 'tir'], capacityKg: 20000, coverageAreas: ['Antalya', 'Burdur', 'Isparta', 'Mersin', 'Konya'], pricePerKm: 22, hasColdChain: false, description: 'Akdeniz Bölgesi tarım ürünleri taşımacılığında 15 yıllık deneyim. Sebze-meyve taşımacılığında uzman.', rating: 4.7, ratingCount: 34, isVerified: true, isActive: true },
  { name: 'Mehmet Kaya', companyName: 'Kaya Soğuk Zincir', phone: '5339876543', whatsapp: '5339876543', city: 'Mersin', district: 'Akdeniz', vehicleTypes: ['frigo', 'soguk-zincir'], capacityKg: 15000, coverageAreas: ['Mersin', 'Adana', 'Hatay', 'Ankara', 'İstanbul'], pricePerKm: 35, hasColdChain: true, description: 'Soğuk zincir taşımacılık uzmanı. Narenciye ve hassas meyve taşımacılığı. GPS takipli araçlar.', rating: 4.9, ratingCount: 52, isVerified: true, isActive: true },
  { name: 'Hasan Demir', companyName: 'Demir Lojistik', phone: '5425551234', whatsapp: '5425551234', city: 'İstanbul', district: 'Beylikdüzü', vehicleTypes: ['tir', 'kamyon'], capacityKg: 30000, coverageAreas: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'], pricePerKm: 28, hasColdChain: false, description: 'Büyük hacimli tarım ürünü taşımacılığı. Haftanın 7 günü hizmet. Sigortalı taşımacılık.', rating: 4.5, ratingCount: 28, isVerified: true, isActive: true },
  { name: 'Ali Çelik', companyName: 'Çelik Tarım Nakliye', phone: '5447778899', whatsapp: '5447778899', city: 'Konya', district: 'Selçuklu', vehicleTypes: ['kamyon', 'tir'], capacityKg: 25000, coverageAreas: ['Konya', 'Aksaray', 'Karaman', 'Ankara', 'Eskişehir'], pricePerKm: 20, hasColdChain: false, description: 'İç Anadolu tahıl ve baklagil taşımacılığında uzman. Silo tesislerine direk teslimat.', rating: 4.3, ratingCount: 19, isVerified: false, isActive: true },
  { name: 'Osman Aydın', companyName: 'Aydın Frigo', phone: '5361112233', whatsapp: '5361112233', city: 'İzmir', district: 'Bornova', vehicleTypes: ['frigo', 'soguk-zincir', 'kamyon'], capacityKg: 18000, coverageAreas: ['İzmir', 'Aydın', 'Manisa', 'Denizli', 'Muğla', 'İstanbul'], pricePerKm: 32, hasColdChain: true, description: 'Ege Bölgesi meyve-sebze soğuk zincir taşımacılığı. Üzüm, incir, zeytin özel paketleme.', rating: 4.8, ratingCount: 41, isVerified: true, isActive: true },
  { name: 'Mustafa Özkan', companyName: 'Özkan Nakliyat', phone: '5553334455', whatsapp: '5553334455', city: 'Adana', district: 'Seyhan', vehicleTypes: ['kamyon', 'minibus'], capacityKg: 10000, coverageAreas: ['Adana', 'Mersin', 'Hatay', 'Osmaniye', 'Gaziantep'], pricePerKm: 18, hasColdChain: false, description: 'Çukurova Bölgesi pamuk, mısır ve narenciye taşımacılığı. Küçük parti taşıma imkânı.', rating: 4.1, ratingCount: 15, isVerified: false, isActive: true },
  { name: 'İbrahim Şahin', companyName: 'Şahin Karadeniz Nakliye', phone: '5327776655', whatsapp: '5327776655', city: 'Trabzon', district: 'Ortahisar', vehicleTypes: ['kamyon', 'minibus'], capacityKg: 12000, coverageAreas: ['Trabzon', 'Rize', 'Giresun', 'Ordu', 'Artvin', 'Ankara', 'İstanbul'], pricePerKm: 25, hasColdChain: false, description: 'Karadeniz çay ve fındık taşımacılığında 20 yıl. Dağlık arazi deneyimi.', rating: 4.6, ratingCount: 37, isVerified: true, isActive: true },
  { name: 'Kemal Arslan', companyName: 'Arslan Soğuk Depo & Nakliye', phone: '5448889900', whatsapp: '5448889900', city: 'Ankara', district: 'Polatlı', vehicleTypes: ['tir', 'frigo', 'soguk-zincir'], capacityKg: 35000, coverageAreas: ['Ankara', 'Konya', 'Kayseri', 'Eskişehir', 'İstanbul', 'İzmir'], pricePerKm: 30, hasColdChain: true, description: 'Türkiye geneli soğuk zincir ve kuru yük taşımacılığı. Depolama + dağıtım entegre hizmet.', rating: 4.4, ratingCount: 23, isVerified: true, isActive: true },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hasatlink');
    console.log('MongoDB connected for feature seeding');

    // 1) Feature flag'ları aç
    const features = [
      'qnaForum', 'harvestCalendar', 'logisticsDirectory',
      'weatherAlerts', 'mapView', 'successStories', 'priceForecast',
    ];
    const update: any = {};
    for (const f of features) update[`${f}.enabled`] = true;

    await SiteSettings.findOneAndUpdate({}, { $set: update }, { upsert: true });
    console.log(`✓ ${features.length} feature flag aktif edildi`);

    // 2) Hasat Takvimi
    await HarvestCalendar.deleteMany({});
    await HarvestCalendar.insertMany(harvestItems);
    console.log(`✓ ${harvestItems.length} hasat takvimi ürünü eklendi`);

    // 3) Nakliyeci
    await LogisticsProvider.deleteMany({});
    await LogisticsProvider.insertMany(logisticsProviders);
    console.log(`✓ ${logisticsProviders.length} nakliyeci eklendi`);

    console.log('\n═══════════════════════════════════════');
    console.log('  FEATURE SEED TAMAMLANDI!');
    console.log('  - Forum: AKTİF (kullanıcılar soru soracak)');
    console.log('  - Hasat Takvimi: AKTİF + veri yüklendi');
    console.log('  - Nakliyeci Rehberi: AKTİF + veri yüklendi');
    console.log('  - AI Teşhis: Zaten hardcoded (Gemini API key gerekli)');
    console.log('  - Hava Uyarıları, Harita, Başarı Hikayeleri: AKTİF');
    console.log('═══════════════════════════════════════\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Feature seed error:', error);
    process.exit(1);
  }
};

seed();
