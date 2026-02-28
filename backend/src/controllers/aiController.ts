import { Request, Response } from 'express';
import AIDiagnosis from '../models/AIDiagnosis';
import SiteSettings from '../models/SiteSettings';

const DISEASES = [
  { disease: 'Yaprak Yanıklığı (Leaf Blight)', confidence: 92, treatment: 'Bakırlı fungisit uygulayın. Enfekte yaprakları uzaklaştırın. Sulama düzenini kontrol edin.' },
  { disease: 'Külleme (Powdery Mildew)', confidence: 88, treatment: 'Kükürt bazlı fungisit kullanın. Hava sirkülasyonunu artırın. Aşırı azotlu gübreden kaçının.' },
  { disease: 'Pas Hastalığı (Rust)', confidence: 85, treatment: 'Triazol grubu fungisit uygulayın. Enfekte bitki artıklarını imha edin. Dayanıklı çeşitler tercih edin.' },
  { disease: 'Mildiyö (Downy Mildew)', confidence: 90, treatment: 'Metalaksil içeren fungisit kullanın. Yaprakların ıslanmasını önleyin. Damla sulama tercih edin.' },
  { disease: 'Kök Çürüklüğü (Root Rot)', confidence: 78, treatment: 'Toprak drenajını iyileştirin. Biyolojik fungisit (Trichoderma) uygulayın. Aşırı sulamadan kaçının.' },
  { disease: 'Yaprak Lekesi (Leaf Spot)', confidence: 86, treatment: 'Maneb veya klorotalonil uygulayın. Enfekte yaprakları toplayın. Ekim nöbeti uygulayın.' },
  { disease: 'Antraknoz (Anthracnose)', confidence: 83, treatment: 'Bakırlı preparatlar kullanın. Hasat sonrası bitki artıklarını temizleyin. Sertifikalı tohum kullanın.' },
  { disease: 'Fusarium Solgunluğu', confidence: 81, treatment: 'Toprak solarizasyonu yapın. Dayanıklı anaç kullanın. Biyolojik mücadele ajanları uygulayın.' },
  { disease: 'Bakteriyel Yanıklık', confidence: 87, treatment: 'Streptomisin sülfat uygulayın. Enfekte dalları kesin. Budama aletlerini dezenfekte edin.' },
  { disease: 'Virüs Mozaik Hastalığı', confidence: 75, treatment: 'Enfekte bitkileri uzaklaştırın. Yaprak biti kontrolü yapın. Virus-free fide kullanın.' },
  { disease: 'Sağlıklı Bitki', confidence: 95, treatment: 'Bitkiniz sağlıklı görünüyor. Düzenli sulama ve gübrelemeye devam edin.' },
];

export const diagnose = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check daily AI usage limit
    const userId = req.body.userId || (req as any).userId;
    const settings = await SiteSettings.findOne({ key: 'main' });
    if (settings?.aiUsageLimit?.enabled && userId) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayCount = await AIDiagnosis.countDocuments({
        userId,
        createdAt: { $gte: startOfDay },
      });
      if (todayCount >= settings.aiUsageLimit.dailyFreeCount) {
        res.status(429).json({
          message: 'Günlük AI teşhis limitinize ulaştınız',
          limit: settings.aiUsageLimit.dailyFreeCount,
          used: todayCount,
        });
        return;
      }
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const randomIndex = Math.floor(Math.random() * DISEASES.length);
    const result = DISEASES[randomIndex];

    // Save to history if userId provided
    if (userId) {
      await AIDiagnosis.create({
        userId,
        disease: result.disease,
        confidence: result.confidence,
        treatment: result.treatment,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'AI teşhis hatası', error });
  }
};

export const getDiagnosisHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await AIDiagnosis.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Geçmiş hatası', error });
  }
};
