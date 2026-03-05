import { Request, Response } from 'express';
import AIDiagnosis from '../models/AIDiagnosis';
import SiteSettings from '../models/SiteSettings';

// Extended disease database with Turkish agriculture specific crops
const DISEASES = [
  // Zeytin
  {
    disease: 'Zeytin Halkalı Leke (Olive Leaf Spot)',
    disease_code: 'zeytin_halkali_leke',
    crop_type: 'Zeytin',
    confidence: 92,
    treatment: 'Bakırlı fungisit (Bordo bulamacı %1) uygulayın. Enfekte yaprakları toplayıp imha edin. Sonbaharda koruyucu ilaçlama yapın.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
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
  },
  // Narenciye
  {
    disease: 'Narenciye Karaleke (Citrus Black Spot)',
    disease_code: 'narenciye_karaleke',
    crop_type: 'Narenciye',
    confidence: 88,
    treatment: 'Strobilurin grubu fungisit uygulayın. Meyve tuttuktan sonra 3 ilaçlama yapın. Dökülen yaprakları temizleyin.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
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
  },
  // Pamuk
  {
    disease: 'Pamuk Solgunluk Hastalığı (Cotton Wilt)',
    disease_code: 'pamuk_solgunluk',
    crop_type: 'Pamuk',
    confidence: 87,
    treatment: 'Toprak fumigasyonu yapın. Dayanıklı çeşitler ekin. 4-5 yıllık ekim nöbeti uygulayın.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
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
  },
  // Tahıl (Buğday)
  {
    disease: 'Buğday Pası (Wheat Rust)',
    disease_code: 'bugday_pasi',
    crop_type: 'Tahıl',
    confidence: 93,
    treatment: 'Triazol grubu fungisit (Tebukonazol) uygulayın. Dayanıklı çeşitler ekin. Erken ekim yaparak riskten kaçının.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
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
  },
  // Domates
  {
    disease: 'Domates Mildiyö (Tomato Late Blight)',
    disease_code: 'domates_mildiyo',
    crop_type: 'Domates',
    confidence: 94,
    treatment: 'Metalaksil + Mankozeb karışımı uygulayın. Hastalıklı bitkileri hemen uzaklaştırın. Damla sulama tercih edin.',
    stage: 'mid' as const,
    spread_risk: 'high' as const,
    urgency: 'critical' as const,
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
  },
  // Üzüm/Bağ
  {
    disease: 'Bağ Külleme (Grape Powdery Mildew)',
    disease_code: 'bag_kulleme',
    crop_type: 'Üzüm',
    confidence: 91,
    treatment: 'Kükürt bazlı ilaç uygulayın. Yaprak sıklığını azaltın. Erken dönemde koruyucu ilaçlama başlatın.',
    stage: 'early' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
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
  },
  // Fındık
  {
    disease: 'Fındık Külleme (Hazelnut Powdery Mildew)',
    disease_code: 'findik_kulleme',
    crop_type: 'Fındık',
    confidence: 84,
    treatment: 'Triadimefon uygulayın. Enfekte dalları budayın. Bahçede havalandırmayı artırın.',
    stage: 'early' as const,
    spread_risk: 'low' as const,
    urgency: 'low' as const,
  },
  // Çay
  {
    disease: 'Çay Gri Küfü (Tea Grey Blight)',
    disease_code: 'cay_gri_kufu',
    crop_type: 'Çay',
    confidence: 82,
    treatment: 'Enfekte yaprakları toplayın. Bakırlı fungisit uygulayın. Hasat sıklığını artırarak hastalıklı yaprak birikimini önleyin.',
    stage: 'early' as const,
    spread_risk: 'low' as const,
    urgency: 'low' as const,
  },
  // Mısır
  {
    disease: 'Mısır Koçan Kurdu (Corn Earworm)',
    disease_code: 'misir_kocan_kurdu',
    crop_type: 'Mısır',
    confidence: 88,
    treatment: 'Bt mısır çeşitleri ekin. Trichogramma ile biyolojik mücadele yapın. Feromon tuzakları kurun.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
  },
  // Genel
  {
    disease: 'Yaprak Yanıklığı (Leaf Blight)',
    disease_code: 'yaprak_yanikligi',
    crop_type: 'Genel',
    confidence: 92,
    treatment: 'Bakırlı fungisit uygulayın. Enfekte yaprakları uzaklaştırın. Sulama düzenini kontrol edin.',
    stage: 'mid' as const,
    spread_risk: 'medium' as const,
    urgency: 'medium' as const,
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
  },
  {
    disease: 'Sağlıklı Bitki (Healthy Plant)',
    disease_code: 'saglikli',
    crop_type: 'Genel',
    confidence: 96,
    treatment: 'Bitkiniz sağlıklı görünüyor. Düzenli sulama ve gübrelemeye devam edin. Koruyucu ilaçlama takvimini takip edin.',
    stage: 'early' as const,
    spread_risk: 'low' as const,
    urgency: 'low' as const,
  },
];

const CONFIDENCE_THRESHOLD = 85;

export const diagnose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({ message: 'Fotoğraf yüklenmedi' });
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

export const getDiagnosisHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await AIDiagnosis.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Geçmiş hatası', error });
  }
};
