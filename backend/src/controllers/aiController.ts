import { Request, Response } from 'express';
import AIDiagnosis from '../models/AIDiagnosis';
import SiteSettings from '../models/SiteSettings';
import Listing from '../models/Listing';

// ─── COMPREHENSIVE DISEASE DATABASE ───
// Mut/Mersin bölgesi + Türkiye genel tarım hastalıkları
const DISEASES = [
  // ── Zeytin ──
  {
    disease: 'Zeytin Halkalı Leke (Olive Leaf Spot)',
    disease_code: 'zeytin_halkali_leke',
    crop_type: 'Zeytin',
    confidence: 92,
    treatment: 'Bakırlı fungisit (Bordo bulamacı %1) uygulayın. Enfekte yaprakları toplayıp imha edin. Sonbaharda koruyucu ilaçlama yapın.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['spring', 'autumn'],
    region: ['Mersin', 'Mut', 'Anamur', 'Hatay', 'Aydın', 'Muğla'],
    recommended_products: ['Bordo bulamacı', 'Bakırlı fungisit', 'Propineb'],
    prevention: 'Sonbaharda koruyucu bakır ilaçlaması yapın. Budama artıklarını bahçeden uzaklaştırın.',
  },
  {
    disease: 'Zeytin Sineği Zararı (Olive Fruit Fly)',
    disease_code: 'zeytin_sinegi',
    crop_type: 'Zeytin',
    confidence: 89,
    treatment: 'Tuzak kapanları asın. Dimethoate içeren ilaç ile toplu mücadele. Erken hasat yaparak zararı azaltın.',
    stage: 'early' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['summer', 'autumn'],
    region: ['Mersin', 'Mut', 'Hatay', 'Aydın', 'İzmir', 'Muğla'],
    recommended_products: ['Dimethoate', 'Feromon tuzağı', 'Kaolin kil spreyi'],
    prevention: 'Temmuz\'dan itibaren feromon tuzakları kurun. Erken hasat planlayın.',
  },
  {
    disease: 'Zeytin Dal Kanseri (Olive Knot)',
    disease_code: 'zeytin_dal_kanseri',
    crop_type: 'Zeytin',
    confidence: 87,
    treatment: 'Enfekte dalları sağlam dokuya kadar kesin. Kesim aletlerini dezenfekte edin. Bakırlı macun sürün.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['spring', 'winter'],
    region: ['Mersin', 'Mut', 'Aydın', 'İzmir', 'Balıkesir'],
    recommended_products: ['Bakırlı macun', 'Bordo bulamacı', 'Budama makası'],
    prevention: 'Yağmurlu havalarda budama yapmayın. Budama aletlerini her ağaç arasında dezenfekte edin.',
  },

  // ── Narenciye ──
  {
    disease: 'Narenciye Karaleke (Citrus Black Spot)',
    disease_code: 'narenciye_karaleke',
    crop_type: 'Narenciye',
    confidence: 88,
    treatment: 'Strobilurin grubu fungisit uygulayın. Meyve tuttuktan sonra 3 ilaçlama yapın. Dökülen yaprakları temizleyin.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['spring', 'summer'],
    region: ['Mersin', 'Mut', 'Adana', 'Hatay', 'Antalya'],
    recommended_products: ['Azoksistrobin', 'Mankozeb', 'Bakırlı fungisit'],
    prevention: 'Düşen yaprakları toplayın. Ağaç altı temizliği yapın.',
  },
  {
    disease: 'Narenciye Tristeza Virüsü (CTV)',
    disease_code: 'narenciye_tristeza',
    crop_type: 'Narenciye',
    confidence: 85,
    treatment: 'Enfekte ağaçları sökün. Yaprak biti vektörünü kontrol edin. Dayanıklı anaç kullanın.',
    stage: 'advanced' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['spring', 'summer', 'autumn', 'winter'],
    region: ['Mersin', 'Adana', 'Hatay', 'Antalya', 'Muğla'],
    recommended_products: ['İnsektisit (Yaprak biti)', 'Dayanıklı anaç', 'Mineral yağ'],
    prevention: 'Sertifikalı fidanlar kullanın. Yaprak biti popülasyonunu izleyin.',
  },
  {
    disease: 'Narenciye Uçkurutan (Citrus Mal Secco)',
    disease_code: 'narenciye_uckurutan',
    crop_type: 'Narenciye',
    confidence: 90,
    treatment: 'Enfekte dalları 20 cm sağlam dokuya kadar kesin. Bakırlı fungisit ile yaraya macun sürün. Dayanıklı çeşitler tercih edin.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['autumn', 'winter', 'spring'],
    region: ['Mersin', 'Mut', 'Erdemli', 'Adana', 'Antalya'],
    recommended_products: ['Bakırlı fungisit', 'Yara macunu', 'Budama makası'],
    prevention: 'Yağmurlu günlerde budama yapmayın. Kesim aletlerini dezenfekte edin. Meyer limon gibi dayanıklı çeşitler tercih edin.',
  },
  {
    disease: 'Narenciye Kırmızı Örümcek (Citrus Red Mite)',
    disease_code: 'narenciye_kirmizi_orumcek',
    crop_type: 'Narenciye',
    confidence: 91,
    treatment: 'Akarisit uygulayın. Yaz aylarında yaprak altı ilaçlama yapın. Doğal düşmanları (Phytoseiidae) koruyun.',
    stage: 'early' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['summer', 'autumn'],
    region: ['Mersin', 'Adana', 'Hatay', 'Antalya'],
    recommended_products: ['Abamektin', 'Spirodiklofen', 'Mineral yağ'],
    prevention: 'Aşırı azotlu gübrelemeden kaçının. Doğal düşmanları koruyun.',
  },

  // ── Pamuk ──
  {
    disease: 'Pamuk Solgunluk Hastalığı (Cotton Wilt)',
    disease_code: 'pamuk_solgunluk',
    crop_type: 'Pamuk',
    confidence: 87,
    treatment: 'Toprak fumigasyonu yapın. Dayanıklı çeşitler ekin. 4-5 yıllık ekim nöbeti uygulayın.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['summer'],
    region: ['Adana', 'Hatay', 'Şanlıurfa', 'Diyarbakır', 'Mersin'],
    recommended_products: ['Toprak fumigantı', 'Trichoderma preparatı', 'Dayanıklı tohum'],
    prevention: 'Ekim nöbeti uygulayın. Sulama suyunu kontrol edin.',
  },
  {
    disease: 'Pamuk Yaprak Kurdu (Cotton Leafworm)',
    disease_code: 'pamuk_yaprak_kurdu',
    crop_type: 'Pamuk',
    confidence: 91,
    treatment: 'Bacillus thuringiensis (Bt) biyoinsektisit kullanın. Feromon tuzakları kurun. Doğal düşmanları koruyun.',
    stage: 'early' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['summer', 'autumn'],
    region: ['Adana', 'Hatay', 'Şanlıurfa', 'Mersin'],
    recommended_products: ['Bt biyoinsektisit', 'Feromon tuzağı', 'Emamektin benzoat'],
    prevention: 'Feromon tuzakları ile popülasyon takibi yapın.',
  },

  // ── Tahıl (Buğday) ──
  {
    disease: 'Buğday Pası (Wheat Rust)',
    disease_code: 'bugday_pasi',
    crop_type: 'Tahıl',
    confidence: 93,
    treatment: 'Triazol grubu fungisit (Tebukonazol) uygulayın. Dayanıklı çeşitler ekin. Erken ekim yaparak riskten kaçının.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['spring'],
    region: ['Konya', 'Ankara', 'Eskişehir', 'Kırşehir', 'Mersin'],
    recommended_products: ['Tebukonazol', 'Propikonazol', 'Dayanıklı tohum'],
    prevention: 'Erken ekim yapın. Dayanıklı çeşitler tercih edin.',
  },
  {
    disease: 'Buğday Külleme (Wheat Powdery Mildew)',
    disease_code: 'bugday_kulleme',
    crop_type: 'Tahıl',
    confidence: 90,
    treatment: 'Kükürt bazlı fungisit kullanın. Azotlu gübrelemeyi dengeleyin. Hava sirkülasyonu sağlayın.',
    stage: 'early' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['spring'],
    region: ['Konya', 'Ankara', 'Eskişehir'],
    recommended_products: ['Kükürt', 'Triadimefon', 'Trifloksistrobin'],
    prevention: 'Aşırı azotlu gübrelemeden kaçının. Ekim sıklığını azaltın.',
  },

  // ── Domates ──
  {
    disease: 'Domates Mildiyö (Tomato Late Blight)',
    disease_code: 'domates_mildiyo',
    crop_type: 'Domates',
    confidence: 94,
    treatment: 'Metalaksil + Mankozeb karışımı uygulayın. Hastalıklı bitkileri hemen uzaklaştırın. Damla sulama tercih edin.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['spring', 'summer'],
    region: ['Antalya', 'Mersin', 'Mut', 'Adana', 'Muğla'],
    recommended_products: ['Metalaksil', 'Mankozeb', 'Fosetil aluminyum'],
    prevention: 'Havalandırma sağlayın. Damla sulama kullanın. Hastalıklı artıkları temizleyin.',
  },
  {
    disease: 'Domates Yaprak Lekesi (Tomato Leaf Spot)',
    disease_code: 'domates_yaprak_lekesi',
    crop_type: 'Domates',
    confidence: 86,
    treatment: 'Klorotalonil uygulayın. Alt yaprakları budayın. Ekim nöbeti yapın.',
    stage: 'early' as const,
    spread_risk: 'low' as const,
    urgency: 'low' as const,
    season: ['summer'],
    region: ['Antalya', 'Mersin', 'Adana'],
    recommended_products: ['Klorotalonil', 'Bakırlı fungisit'],
    prevention: 'Alt yaprakları düzenli budayın. Üstten sulamadan kaçının.',
  },
  {
    disease: 'Domates Beyazsinek (Tomato Whitefly)',
    disease_code: 'domates_beyazsinek',
    crop_type: 'Domates',
    confidence: 88,
    treatment: 'Sarı yapışkan tuzak asın. İmidakloprid veya spiromesifen uygulayın. Sera havalandırmasını kontrol edin.',
    stage: 'early' as const,
    spread_risk: 'high' as const,
    urgency: 'medium' as const,
    season: ['spring', 'summer', 'autumn'],
    region: ['Antalya', 'Mersin', 'Adana', 'Muğla'],
    recommended_products: ['Sarı yapışkan tuzak', 'İmidakloprid', 'Spiromesifen'],
    prevention: 'Sera girişlerine böcek tülü takın. Sarı tuzakları sürekli tutun.',
  },

  // ── Üzüm/Bağ ──
  {
    disease: 'Bağ Külleme (Grape Powdery Mildew)',
    disease_code: 'bag_kulleme',
    crop_type: 'Üzüm',
    confidence: 91,
    treatment: 'Kükürt bazlı ilaç uygulayın. Yaprak sıklığını azaltın. Erken dönemde koruyucu ilaçlama başlatın.',
    stage: 'early' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['spring', 'summer'],
    region: ['Mersin', 'Mut', 'Manisa', 'Denizli', 'Elazığ'],
    recommended_products: ['Kükürt', 'Trifloksistrobin', 'Spiroksamin'],
    prevention: 'Yaprak seyreltme yapın. Erken ilkbaharda koruyucu ilaçlama başlatın.',
  },
  {
    disease: 'Bağ Mildiyö (Grape Downy Mildew)',
    disease_code: 'bag_mildiyo',
    crop_type: 'Üzüm',
    confidence: 89,
    treatment: 'Bordo bulamacı uygulayın. Metalaksil+Mankozeb ile tedavi edin. Yağmurlu dönemlerde ilaçlama sıklığını artırın.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['spring', 'summer'],
    region: ['Mersin', 'Mut', 'Manisa', 'Denizli'],
    recommended_products: ['Bordo bulamacı', 'Metalaksil', 'Fosetil aluminyum'],
    prevention: 'Drenajı iyileştirin. Yağmur sonrası 48 saat içinde ilaçlayın.',
  },

  // ── Fındık ──
  {
    disease: 'Fındık Külleme (Hazelnut Powdery Mildew)',
    disease_code: 'findik_kulleme',
    crop_type: 'Fındık',
    confidence: 84,
    treatment: 'Triadimefon uygulayın. Enfekte dalları budayın. Bahçede havalandırmayı artırın.',
    stage: 'early' as const,
    spread_risk: 'low' as const,
    urgency: 'low' as const,
    season: ['spring', 'summer'],
    region: ['Trabzon', 'Giresun', 'Ordu', 'Sakarya'],
    recommended_products: ['Triadimefon', 'Kükürt', 'Trifloksistrobin'],
    prevention: 'Sık budama ile havalandırma sağlayın.',
  },
  {
    disease: 'Fındık Kurdu (Hazelnut Weevil)',
    disease_code: 'findik_kurdu',
    crop_type: 'Fındık',
    confidence: 86,
    treatment: 'Lambda-siyalotrin uygulayın. Yere düşen fındıkları toplayın. Erken hasat yapın.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['summer'],
    region: ['Trabzon', 'Giresun', 'Ordu'],
    recommended_products: ['Lambda-siyalotrin', 'Feromon tuzağı'],
    prevention: 'Haziran başında feromon tuzağı kurun. Dökme fındıkları temizleyin.',
  },

  // ── Çay ──
  {
    disease: 'Çay Gri Küfü (Tea Grey Blight)',
    disease_code: 'cay_gri_kufu',
    crop_type: 'Çay',
    confidence: 82,
    treatment: 'Enfekte yaprakları toplayın. Bakırlı fungisit uygulayın. Hasat sıklığını artırarak hastalıklı yaprak birikimini önleyin.',
    stage: 'early' as const,
    spread_risk: 'low' as const,
    urgency: 'low' as const,
    season: ['spring', 'summer'],
    region: ['Rize', 'Trabzon', 'Artvin', 'Giresun'],
    recommended_products: ['Bakırlı fungisit', 'Bordo bulamacı'],
    prevention: 'Düzenli hasat yapın. Aşırı gölgelendirmeden kaçının.',
  },

  // ── Mısır ──
  {
    disease: 'Mısır Koçan Kurdu (Corn Earworm)',
    disease_code: 'misir_kocan_kurdu',
    crop_type: 'Mısır',
    confidence: 88,
    treatment: 'Bt mısır çeşitleri ekin. Trichogramma ile biyolojik mücadele yapın. Feromon tuzakları kurun.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['summer'],
    region: ['Adana', 'Mersin', 'Şanlıurfa', 'Sakarya'],
    recommended_products: ['Bt tohum', 'Trichogramma', 'Emamektin benzoat'],
    prevention: 'Erken ekim yapın. Ekim nöbeti uygulayın.',
  },

  // ── Muz (Mersin/Anamur özel) ──
  {
    disease: 'Muz Sigatoka Yaprak Lekesi (Banana Sigatoka)',
    disease_code: 'muz_sigatoka',
    crop_type: 'Muz',
    confidence: 85,
    treatment: 'Propikonazol veya Azoksistrobin uygulayın. Enfekte yaprakları kesin. Havalandırma sağlayın.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['spring', 'summer', 'autumn'],
    region: ['Mersin', 'Anamur', 'Alanya', 'Antalya'],
    recommended_products: ['Propikonazol', 'Azoksistrobin', 'Mineral yağ'],
    prevention: 'Sera havalandırmasını artırın. Enfekte yaprakları düzenli temizleyin.',
  },

  // ── Nar (Mersin/Mut özel) ──
  {
    disease: 'Nar İç Kurdu (Pomegranate Fruit Moth)',
    disease_code: 'nar_ic_kurdu',
    crop_type: 'Nar',
    confidence: 87,
    treatment: 'Feromon tuzakları kurun. Spinosad veya Bt preparatı uygulayın. Düşen meyveleri toplayın.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['summer', 'autumn'],
    region: ['Mersin', 'Mut', 'Antalya', 'Hatay', 'Adana'],
    recommended_products: ['Feromon tuzağı', 'Spinosad', 'Bt preparatı'],
    prevention: 'Nisan\'dan itibaren feromon tuzağı takibi yapın.',
  },
  {
    disease: 'Nar Meyve Çürüklüğü (Pomegranate Heart Rot)',
    disease_code: 'nar_meyve_curuklugu',
    crop_type: 'Nar',
    confidence: 83,
    treatment: 'Çiçeklenme döneminde bakırlı fungisit uygulayın. Çatlayan meyveleri uzaklaştırın. Düzenli sulama ile çatlamayı önleyin.',
    stage: 'early' as const,
    spread_risk: 'low' as const,
    urgency: 'medium' as const,
    season: ['summer', 'autumn'],
    region: ['Mersin', 'Mut', 'Antalya', 'Hatay'],
    recommended_products: ['Bakırlı fungisit', 'Bordo bulamacı'],
    prevention: 'Düzenli sulama yapın. Meyve çatlamasını önleyin.',
  },

  // ── Avokado (Mersin özel) ──
  {
    disease: 'Avokado Kök Çürüklüğü (Avocado Root Rot)',
    disease_code: 'avokado_kok_curuklugu',
    crop_type: 'Avokado',
    confidence: 84,
    treatment: 'Fosetil aluminyum uygulayın. Toprak drenajını iyileştirin. Organik malç kullanın.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'critical' as const,
    season: ['spring', 'autumn', 'winter'],
    region: ['Mersin', 'Alanya', 'Antalya'],
    recommended_products: ['Fosetil aluminyum', 'Trichoderma', 'Organik malç'],
    prevention: 'Drenajı iyileştirin. Aşırı sulamadan kaçının.',
  },

  // ── Elma ──
  {
    disease: 'Elma Karaleke (Apple Scab)',
    disease_code: 'elma_karaleke',
    crop_type: 'Elma',
    confidence: 93,
    treatment: 'Kaptan veya Ditianon uygulayın. Kış döneminde dökülen yaprakları temizleyin. Dayanıklı çeşitler tercih edin.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['spring', 'summer'],
    region: ['Isparta', 'Karaman', 'Niğde', 'Mersin'],
    recommended_products: ['Kaptan', 'Ditianon', 'Trifloksistrobin'],
    prevention: 'Sonbaharda yaprak temizliği yapın. İlkbaharda koruyucu ilaçlama başlatın.',
  },
  {
    disease: 'Elma İç Kurdu (Codling Moth)',
    disease_code: 'elma_ic_kurdu',
    crop_type: 'Elma',
    confidence: 90,
    treatment: 'Feromon tuzakları ile takip yapın. Emamektin benzoat veya Spinosad uygulayın.',
    stage: 'early' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['spring', 'summer'],
    region: ['Isparta', 'Karaman', 'Niğde'],
    recommended_products: ['Feromon tuzağı', 'Emamektin benzoat', 'Spinosad'],
    prevention: 'Nisan ayından itibaren feromon tuzağı kurun.',
  },

  // ── Genel Hastalıklar ──
  {
    disease: 'Yaprak Yanıklığı (Leaf Blight)',
    disease_code: 'yaprak_yanikligi',
    crop_type: 'Genel',
    confidence: 92,
    treatment: 'Bakırlı fungisit uygulayın. Enfekte yaprakları uzaklaştırın. Sulama düzenini kontrol edin.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['spring', 'summer', 'autumn'],
    region: [],
    recommended_products: ['Bakırlı fungisit', 'Mankozeb'],
    prevention: 'Bitki artıklarını temizleyin. Aşırı sulamadan kaçının.',
  },
  {
    disease: 'Külleme (Powdery Mildew)',
    disease_code: 'kulleme',
    crop_type: 'Genel',
    confidence: 88,
    treatment: 'Kükürt bazlı fungisit kullanın. Hava sirkülasyonunu artırın. Aşırı azotlu gübreden kaçının.',
    stage: 'early' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
    season: ['spring', 'summer'],
    region: [],
    recommended_products: ['Kükürt', 'Triadimefon', 'Spiroksamin'],
    prevention: 'Havalandırmayı artırın. Azotlu gübrelemeyi dengeleyin.',
  },
  {
    disease: 'Kök Çürüklüğü (Root Rot)',
    disease_code: 'kok_curuklugu',
    crop_type: 'Genel',
    confidence: 78,
    treatment: 'Toprak drenajını iyileştirin. Biyolojik fungisit (Trichoderma) uygulayın. Aşırı sulamadan kaçının.',
    stage: 'advanced' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
    season: ['spring', 'autumn', 'winter'],
    region: [],
    recommended_products: ['Trichoderma', 'Fosetil aluminyum', 'Metalaksil'],
    prevention: 'Drenajı iyileştirin. Aşırı sulamadan kaçının.',
  },
  {
    disease: 'Yaprak Biti (Aphid Infestation)',
    disease_code: 'yaprak_biti',
    crop_type: 'Genel',
    confidence: 92,
    treatment: 'İmidakloprid veya Asetamiprid uygulayın. Doğal düşmanları (uğur böceği) koruyun. Sabunlu su ile yıkayın.',
    stage: 'early' as const,
    spread_risk: 'high' as const,
    urgency: 'medium' as const,
    season: ['spring', 'summer'],
    region: [],
    recommended_products: ['İmidakloprid', 'Asetamiprid', 'Potasyum sabunu'],
    prevention: 'Doğal düşmanları koruyun. Sarı yapışkan tuzak asın.',
  },
  {
    disease: 'Sağlıklı Bitki (Healthy Plant)',
    disease_code: 'saglikli',
    crop_type: 'Genel',
    confidence: 96,
    treatment: 'Bitkiniz sağlıklı görünüyor! Düzenli sulama ve gübrelemeye devam edin. Koruyucu ilaçlama takvimini takip edin.',
    stage: 'early' as const,
    spread_risk: 'low' as const,
    urgency: 'low' as const,
    season: ['spring', 'summer', 'autumn', 'winter'],
    region: [],
    recommended_products: [],
    prevention: 'Düzenli gübreleme ve sulama programına sadık kalın.',
  },
];

// ─── HARVEST PREDICTION DATABASE ───
const HARVEST_DATA: Record<string, {
  min_days: number;
  max_days: number;
  quality_factors: string[];
  optimal_conditions: string;
}> = {
  'Domates': { min_days: 60, max_days: 90, quality_factors: ['Renk koyuluğu', 'Sertlik', 'Büyüklük'], optimal_conditions: 'Gündüz 25-30°C, gece 15-18°C, düzenli sulama' },
  'Zeytin': { min_days: 150, max_days: 210, quality_factors: ['Meyve büyüklüğü', 'Yağ oranı', 'Renk dönüşümü'], optimal_conditions: 'Sıcak yaz, ılıman sonbahar, hasat ekim-aralık' },
  'Narenciye': { min_days: 180, max_days: 300, quality_factors: ['Kabuk rengi', 'Meyve ağırlığı', 'Şeker/asit oranı'], optimal_conditions: 'Ilıman kış, sıcak yaz, düzenli sulama' },
  'Üzüm': { min_days: 100, max_days: 150, quality_factors: ['Şeker oranı (Brix)', 'Tane sertliği', 'Salkım dolgunluğu'], optimal_conditions: 'Sıcak gündüz, serin gece, az yağış' },
  'Tahıl': { min_days: 120, max_days: 180, quality_factors: ['Tane dolgunluğu', 'Nem oranı', 'Protein içeriği'], optimal_conditions: 'İlkbahar yağışlı, yaz sıcak ve kuru' },
  'Pamuk': { min_days: 150, max_days: 200, quality_factors: ['Koza büyüklüğü', 'Lif uzunluğu', 'Beyazlık'], optimal_conditions: 'Sıcak ve uzun yaz mevsimi' },
  'Muz': { min_days: 270, max_days: 365, quality_factors: ['Parmak uzunluğu', 'Kabuk rengi', 'Etlilik'], optimal_conditions: 'Serada 20-30°C, yüksek nem' },
  'Nar': { min_days: 150, max_days: 200, quality_factors: ['Meyve ağırlığı', 'Tane rengi', 'Kabuk çatlaması'], optimal_conditions: 'Sıcak yaz, ılıman sonbahar' },
  'Fındık': { min_days: 140, max_days: 180, quality_factors: ['İç dolgunluk', 'Yağ oranı', 'Kabuk sertliği'], optimal_conditions: 'Nemli ilkbahar, sıcak yaz' },
  'Elma': { min_days: 100, max_days: 180, quality_factors: ['Renk gelişimi', 'Sertlik', 'Şeker/asit dengesi'], optimal_conditions: 'Serin gece, güneşli gündüz' },
  'Avokado': { min_days: 200, max_days: 365, quality_factors: ['Meyve ağırlığı', 'Yağ oranı', 'Kabuk rengi'], optimal_conditions: 'Ilıman iklim, kışın donmayan' },
  'Genel': { min_days: 90, max_days: 180, quality_factors: ['Genel görünüm', 'Büyüklük', 'Olgunluk belirtileri'], optimal_conditions: 'Ürüne göre değişir' },
};

// ─── REGIONAL ALERT SYSTEM ───
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

function getRegionalAlerts(region?: string): Array<{ disease: string; crop_type: string; risk_level: string; message: string }> {
  const season = getCurrentSeason();
  const alerts: Array<{ disease: string; crop_type: string; risk_level: string; message: string }> = [];

  for (const d of DISEASES) {
    if (d.disease_code === 'saglikli') continue;
    const seasonMatch = d.season.includes(season);
    const regionMatch = !region || d.region.length === 0 || d.region.some(r => r.toLowerCase().includes(region.toLowerCase()));

    if (seasonMatch && regionMatch && (d.urgency === 'critical' || d.spread_risk === 'high')) {
      alerts.push({
        disease: d.disease,
        crop_type: d.crop_type,
        risk_level: d.urgency === 'critical' ? 'high' : 'medium',
        message: `${d.crop_type} ureticileri dikkat: ${d.disease.split('(')[0].trim()} su an bolgenizde yaygin. ${d.prevention}`,
      });
    }
  }

  return alerts.slice(0, 5);
}

const CONFIDENCE_THRESHOLD = 85;

// ─── DIAGNOSE ENDPOINT ───
export const diagnose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({ message: 'Fotograf yuklenmedi' });
      return;
    }

    const settings = await SiteSettings.findOne({ key: 'main' });

    // Check daily AI usage limit
    if (settings?.aiUsageLimit?.enabled && userId) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayCount = await AIDiagnosis.countDocuments({
        userId,
        createdAt: { $gte: startOfDay },
      });
      if (todayCount >= settings.aiUsageLimit.dailyFreeCount) {
        res.status(429).json({
          message: 'Gunluk AI teshis limitinize ulastiniz',
          limit: settings.aiUsageLimit.dailyFreeCount,
          used: todayCount,
        });
        return;
      }
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Layer 1: Crop Classification (simulated)
    const cropTypes = [...new Set(DISEASES.map(d => d.crop_type).filter(c => c !== 'Genel'))];
    const detectedCrop = cropTypes[Math.floor(Math.random() * cropTypes.length)];

    // Layer 2: Disease Diagnosis - filter by detected crop + include general diseases
    const candidates = DISEASES.filter(d => d.crop_type === detectedCrop || d.crop_type === 'Genel');
    const result = candidates[Math.floor(Math.random() * candidates.length)];

    const needsBetterPhoto = result.confidence < CONFIDENCE_THRESHOLD;
    const imageUrl = `/uploads/${file.filename}`;

    // Layer 3: Regional alerts
    const alerts = getRegionalAlerts('Mersin');

    // Layer 4: Harvest prediction
    const harvestInfo = HARVEST_DATA[result.crop_type] || HARVEST_DATA['Genel'];
    const estimatedDays = Math.floor(Math.random() * (harvestInfo.max_days - harvestInfo.min_days) + harvestInfo.min_days);
    const qualityScore = result.disease_code === 'saglikli'
      ? Math.floor(Math.random() * 15 + 85) // 85-100 for healthy
      : Math.floor(Math.random() * 30 + 40); // 40-70 for diseased

    const response = {
      disease: result.disease,
      disease_code: result.disease_code,
      confidence: result.confidence,
      treatment: result.treatment,
      stage: result.stage,
      spread_risk: result.spread_risk,
      urgency: result.urgency,
      crop_type: result.crop_type,
      detected_crop: detectedCrop,
      image_url: imageUrl,
      needs_better_photo: needsBetterPhoto,
      warning: needsBetterPhoto
        ? 'Dogruluk orani dusuk. Net sonuc icin daha yakin ve iyi aydinlatilmis bir fotograf cekin.'
        : null,
      // NEW: Extended fields
      recommended_products: result.recommended_products,
      prevention: result.prevention,
      seasonal_alert: result.season.includes(getCurrentSeason()),
      regional_alerts: alerts.filter(a => a.crop_type === result.crop_type || a.crop_type === detectedCrop).slice(0, 2),
      harvest_prediction: {
        estimated_days: estimatedDays,
        quality_score: qualityScore,
        quality_label: qualityScore >= 80 ? 'Yuksek' : qualityScore >= 50 ? 'Orta' : 'Dusuk',
        quality_factors: harvestInfo.quality_factors,
        optimal_conditions: harvestInfo.optimal_conditions,
      },
    };

    // Save to history
    if (userId) {
      await AIDiagnosis.create({
        userId,
        disease: result.disease,
        disease_code: result.disease_code,
        confidence: result.confidence,
        treatment: result.treatment,
        stage: result.stage,
        spread_risk: result.spread_risk,
        urgency: result.urgency,
        crop_type: result.crop_type,
        image_url: imageUrl,
      });
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'AI teshis hatasi', error });
  }
};

// ─── DIAGNOSIS HISTORY ───
export const getDiagnosisHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await AIDiagnosis.find({ userId: req.params.userId as string })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Gecmis hatasi', error });
  }
};

// ─── DISEASE LIBRARY ───
export const getDiseaseLibrary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const season = getCurrentSeason();
    const library = DISEASES
      .filter(d => d.disease_code !== 'saglikli')
      .map(d => ({
        disease: d.disease,
        disease_code: d.disease_code,
        crop_type: d.crop_type,
        urgency: d.urgency,
        spread_risk: d.spread_risk,
        treatment: d.treatment,
        recommended_products: d.recommended_products,
        prevention: d.prevention,
        is_seasonal: d.season.includes(season),
        active_regions: d.region,
      }));

    res.json({ diseases: library, season, total: library.length });
  } catch (error) {
    res.status(500).json({ message: 'Kutuphane hatasi', error });
  }
};

// ─── REGIONAL ALERTS ───
export const getRegionalAlertsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const region = req.query.region as string || 'Mersin';
    const alerts = getRegionalAlerts(region);
    res.json({ alerts, region, season: getCurrentSeason() });
  } catch (error) {
    res.status(500).json({ message: 'Uyari hatasi', error });
  }
};

// ─── SMART MATCHING - Related listings for disease ───
export const getSmartMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const disease_code = req.params.disease_code as string;
    const disease = DISEASES.find(d => d.disease_code === disease_code);
    if (!disease) {
      res.json({ listings: [], professionals: [] });
      return;
    }

    // Search for related product listings (ilac, gubre)
    const searchTerms = disease.recommended_products.map(p => p.toLowerCase());
    const cropTerm = disease.crop_type.toLowerCase();

    const listings = await Listing.find({
      status: 'active',
      $or: [
        { title: { $regex: searchTerms.join('|'), $options: 'i' } },
        { description: { $regex: searchTerms.join('|'), $options: 'i' } },
        { title: { $regex: cropTerm, $options: 'i' } },
        { category: { $regex: 'gubre|ilac|tohum|fide', $options: 'i' } },
      ],
    })
      .sort({ 'stats.views': -1 })
      .limit(6)
      .select('title price images type category sellerName sellerImage city stats')
      .lean();

    // Search for professional profiles (ziraat muhendisi, etc.)
    const professionals = await Listing.find({
      status: 'active',
      type: 'isgucu',
      $or: [
        { title: { $regex: 'muhendis|ziraat|ilac|spraying', $options: 'i' } },
        { description: { $regex: cropTerm, $options: 'i' } },
      ],
    })
      .sort({ 'stats.views': -1 })
      .limit(4)
      .select('title price images type sellerName sellerImage city stats')
      .lean();

    res.json({ listings, professionals, disease_name: disease.disease, crop_type: disease.crop_type });
  } catch (error) {
    res.status(500).json({ message: 'Eslestirme hatasi', error });
  }
};

// ─── HARVEST PREDICTION (standalone) ───
export const getHarvestPrediction = async (req: Request, res: Response): Promise<void> => {
  try {
    const crop_type = req.params.crop_type as string;
    const harvestInfo = HARVEST_DATA[crop_type] || HARVEST_DATA['Genel'];
    const estimatedDays = Math.floor(Math.random() * (harvestInfo.max_days - harvestInfo.min_days) + harvestInfo.min_days);
    const qualityScore = Math.floor(Math.random() * 25 + 70);

    res.json({
      crop_type,
      estimated_days: estimatedDays,
      estimated_date: new Date(Date.now() + estimatedDays * 86400000).toISOString().split('T')[0],
      quality_score: qualityScore,
      quality_label: qualityScore >= 80 ? 'Yuksek' : qualityScore >= 50 ? 'Orta' : 'Dusuk',
      quality_factors: harvestInfo.quality_factors,
      optimal_conditions: harvestInfo.optimal_conditions,
      season: getCurrentSeason(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Hasat tahmini hatasi', error });
  }
};
