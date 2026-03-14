import { Request, Response } from 'express';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AIDiagnosis from '../models/AIDiagnosis';
import SiteSettings from '../models/SiteSettings';
import Listing from '../models/Listing';

// ─── Gemini Configuration ───
function getGemini() {
  const key = process.env.GEMINI_API_KEY || '';
  return new GoogleGenerativeAI(key);
}

const MASTER_PROMPT = `Sen uzman bir Ziraat Muhendisisin. Bu fotograftaki bitkiyi analiz et.

Asagidaki JSON formatinda cevap ver (baska hicbir sey yazma, sadece JSON):
{
  "crop_type": "Bitki turu (ornek: Domates, Zeytin, Narenciye, Uzum, Bugday, vb.)",
  "disease": "Hastalik veya sorun adi (saglikli ise 'Saglikli Bitki')",
  "disease_code": "hastalik_kodu (kucuk harf, alt cizgi, ornek: domates_mildiyo, saglikli)",
  "confidence": 85,
  "stage": "early | mid | advanced",
  "spread_risk": "low | medium | high",
  "urgency": "low | medium | critical",
  "treatment": "Detayli tedavi ve cozum onerisi. Ciftcinin anlayacagi sadelikte yaz.",
  "recommended_products": ["Urun1", "Urun2"],
  "prevention": "Onleme onerileri",
  "detailed_analysis": "Fotograftaki bitkinin detayli durumu: bitki turu, yaprak durumu, renk, leke, hasarlik, besin eksikligi analizi. Profesyonel ama bir ciftcinin anlayacagi sadelikte, basliklar halinde yaz."
}

Onemli kurallar:
- Eger bitki saglikli gorunuyorsa disease_code olarak "saglikli" yaz
- confidence 0-100 arasi olmali
- treatment alaninda somut ve uygulanabilir adimlar yaz
- detailed_analysis alaninda bitki turunu, gorunen sorunlari, nedenlerini ve acil yapilmasi gerekenleri detayli acikla
- Sadece JSON don, aciklama veya markdown ekleme`;

const FOLLOWUP_SYSTEM = `Sen uzman bir Ziraat Muhendisisin. Bir ciftci sana onceki analiz sonucuyla ilgili ek sorular soruyor.
Profesyonel ama anlasilir bir dilde, somut ve uygulanabilir tavsiyeler ver.
Turkce cevap ver. Kisa ve oze doku.`;

// ─── Gemini Vision Analysis ───
async function analyzeWithGemini(imagePath: string): Promise<any | null> {
  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = imagePath.split('.').pop()?.toLowerCase() || 'jpeg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const result = await model.generateContent([
      MASTER_PROMPT,
      { inlineData: { data: base64, mimeType } },
    ]);

    const text = result.response.text();
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (err: any) {
    console.error('[Gemini] Analysis error:', err.message);
    return null;
  }
}

// ─── COMPREHENSIVE DISEASE DATABASE (for Smart Matching) ───
const DISEASES = [
  { disease: 'Zeytin Halkali Leke', disease_code: 'zeytin_halkali_leke', crop_type: 'Zeytin', confidence: 92, treatment: 'Bakirli fungisit uygulayın.', stage: 'mid' as const, spread_risk: 'medium' as const, urgency: 'medium' as const, season: ['spring', 'autumn'], region: ['Mersin', 'Mut', 'Anamur'], recommended_products: ['Bordo bulamaci', 'Bakirli fungisit', 'Propineb'], prevention: 'Sonbaharda koruyucu bakir ilaclamasi yapin.' },
  { disease: 'Zeytin Sinegi Zarari', disease_code: 'zeytin_sinegi', crop_type: 'Zeytin', confidence: 89, treatment: 'Tuzak kapanlari asin.', stage: 'early' as const, spread_risk: 'high' as const, urgency: 'critical' as const, season: ['summer', 'autumn'], region: ['Mersin', 'Mut'], recommended_products: ['Dimethoate', 'Feromon tuzagi'], prevention: 'Feromon tuzaklari kurun.' },
  { disease: 'Narenciye Karaleke', disease_code: 'narenciye_karaleke', crop_type: 'Narenciye', confidence: 88, treatment: 'Strobilurin grubu fungisit uygulayin.', stage: 'mid' as const, spread_risk: 'medium' as const, urgency: 'medium' as const, season: ['spring', 'summer'], region: ['Mersin', 'Adana'], recommended_products: ['Azoksistrobin', 'Mankozeb'], prevention: 'Dusen yapraklari toplayin.' },
  { disease: 'Narenciye Tristeza Virusu', disease_code: 'narenciye_tristeza', crop_type: 'Narenciye', confidence: 85, treatment: 'Enfekte agaclari sokun.', stage: 'advanced' as const, spread_risk: 'high' as const, urgency: 'critical' as const, season: ['spring', 'summer', 'autumn', 'winter'], region: ['Mersin', 'Adana'], recommended_products: ['Insektisit', 'Dayanikli anac'], prevention: 'Sertifikali fidanlar kullanin.' },
  { disease: 'Domates Mildiyo', disease_code: 'domates_mildiyo', crop_type: 'Domates', confidence: 94, treatment: 'Metalaksil + Mankozeb karisimi uygulayin.', stage: 'mid' as const, spread_risk: 'high' as const, urgency: 'critical' as const, season: ['spring', 'summer'], region: ['Antalya', 'Mersin'], recommended_products: ['Metalaksil', 'Mankozeb', 'Fosetil aluminyum'], prevention: 'Havalandirma saglayin.' },
  { disease: 'Domates Yaprak Lekesi', disease_code: 'domates_yaprak_lekesi', crop_type: 'Domates', confidence: 86, treatment: 'Klorotalonil uygulayin.', stage: 'early' as const, spread_risk: 'low' as const, urgency: 'low' as const, season: ['summer'], region: ['Antalya', 'Mersin'], recommended_products: ['Klorotalonil', 'Bakirli fungisit'], prevention: 'Alt yapraklari budayin.' },
  { disease: 'Bag Kulleme', disease_code: 'bag_kulleme', crop_type: 'Uzum', confidence: 91, treatment: 'Kukurt bazli ilac uygulayin.', stage: 'early' as const, spread_risk: 'medium' as const, urgency: 'medium' as const, season: ['spring', 'summer'], region: ['Mersin', 'Manisa'], recommended_products: ['Kukurt', 'Trifloksistrobin'], prevention: 'Yaprak seyreltme yapin.' },
  { disease: 'Bag Mildiyo', disease_code: 'bag_mildiyo', crop_type: 'Uzum', confidence: 89, treatment: 'Bordo bulamaci uygulayin.', stage: 'mid' as const, spread_risk: 'high' as const, urgency: 'critical' as const, season: ['spring', 'summer'], region: ['Mersin', 'Manisa'], recommended_products: ['Bordo bulamaci', 'Metalaksil'], prevention: 'Drenaji iyilestirin.' },
  { disease: 'Yaprak Yanikligi', disease_code: 'yaprak_yanikligi', crop_type: 'Genel', confidence: 92, treatment: 'Bakirli fungisit uygulayin.', stage: 'mid' as const, spread_risk: 'medium' as const, urgency: 'medium' as const, season: ['spring', 'summer', 'autumn'], region: [], recommended_products: ['Bakirli fungisit', 'Mankozeb'], prevention: 'Bitki artiklarini temizleyin.' },
  { disease: 'Kulleme', disease_code: 'kulleme', crop_type: 'Genel', confidence: 88, treatment: 'Kukurt bazli fungisit kullanin.', stage: 'early' as const, spread_risk: 'medium' as const, urgency: 'medium' as const, season: ['spring', 'summer'], region: [], recommended_products: ['Kukurt', 'Triadimefon'], prevention: 'Havalandirmayi artirin.' },
  { disease: 'Saglikli Bitki', disease_code: 'saglikli', crop_type: 'Genel', confidence: 96, treatment: 'Bitkiniz saglikli gorunuyor!', stage: 'early' as const, spread_risk: 'low' as const, urgency: 'low' as const, season: ['spring', 'summer', 'autumn', 'winter'], region: [], recommended_products: [], prevention: 'Duzenli gubreleme ve sulama programina sadik kalin.' },
];

// ─── HARVEST PREDICTION DATABASE ───
const HARVEST_DATA: Record<string, { min_days: number; max_days: number; quality_factors: string[]; optimal_conditions: string }> = {
  'Domates': { min_days: 60, max_days: 90, quality_factors: ['Renk koyulugu', 'Sertlik', 'Buyukluk'], optimal_conditions: 'Gunduz 25-30C, gece 15-18C' },
  'Zeytin': { min_days: 150, max_days: 210, quality_factors: ['Meyve buyuklugu', 'Yag orani', 'Renk donusumu'], optimal_conditions: 'Sicak yaz, iliman sonbahar' },
  'Narenciye': { min_days: 180, max_days: 300, quality_factors: ['Kabuk rengi', 'Meyve agirligi', 'Seker/asit orani'], optimal_conditions: 'Iliman kis, sicak yaz' },
  'Uzum': { min_days: 100, max_days: 150, quality_factors: ['Seker orani', 'Tane sertligi', 'Salkim dolgunlugu'], optimal_conditions: 'Sicak gunduz, serin gece' },
  'Genel': { min_days: 90, max_days: 180, quality_factors: ['Genel gorunum', 'Buyukluk', 'Olgunluk belirtileri'], optimal_conditions: 'Urune gore degisir' },
};

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

const CONFIDENCE_THRESHOLD = 85;

// ─── DIAGNOSE ENDPOINT (Gemini Vision) ───
export const diagnose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) { res.status(400).json({ message: 'Fotograf yuklenmedi' }); return; }

    const settings = await SiteSettings.findOne({ key: 'main' });
    if (settings?.aiUsageLimit?.enabled && userId) {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const todayCount = await AIDiagnosis.countDocuments({ userId, createdAt: { $gte: startOfDay } });
      if (todayCount >= settings.aiUsageLimit.dailyFreeCount) {
        res.status(429).json({ message: 'Gunluk AI teshis limitinize ulastiniz', limit: settings.aiUsageLimit.dailyFreeCount, used: todayCount });
        return;
      }
    }

    const imageUrl = `/uploads/${file.filename}`;
    const imagePath = file.path;

    // ─── Gemini Vision Analysis ───
    let geminiResult = await analyzeWithGemini(imagePath);
    let usedGemini = !!geminiResult;

    // If Gemini fails, return error instead of fake data
    if (!geminiResult) {
      res.status(503).json({
        message: 'AI analiz servisi su an kullanilamamaktadir. Lutfen daha sonra tekrar deneyin.',
        ai_engine: 'none',
        error_code: 'GEMINI_UNAVAILABLE',
      });
      return;
    }

    const isHealthy = geminiResult.disease_code === 'saglikli' || geminiResult.disease?.toLowerCase().includes('saglikli');
    const confidence = geminiResult.confidence || 85;
    const needsBetterPhoto = confidence < CONFIDENCE_THRESHOLD;

    // Harvest prediction
    const harvestInfo = HARVEST_DATA[geminiResult.crop_type] || HARVEST_DATA['Genel'];
    const estimatedDays = Math.floor(Math.random() * (harvestInfo.max_days - harvestInfo.min_days) + harvestInfo.min_days);
    const qualityScore = isHealthy ? Math.floor(Math.random() * 15 + 85) : Math.floor(Math.random() * 30 + 40);

    const response = {
      disease: geminiResult.disease || 'Bilinmeyen',
      disease_code: isHealthy ? 'saglikli' : (geminiResult.disease_code || 'bilinmeyen'),
      confidence,
      treatment: geminiResult.treatment || '',
      stage: geminiResult.stage || 'mid',
      spread_risk: geminiResult.spread_risk || 'medium',
      urgency: geminiResult.urgency || 'medium',
      crop_type: geminiResult.crop_type || 'Genel',
      detected_crop: geminiResult.crop_type || '',
      image_url: imageUrl,
      needs_better_photo: needsBetterPhoto,
      warning: needsBetterPhoto ? 'Dogruluk orani dusuk. Net sonuc icin daha yakin ve iyi aydinlatilmis bir fotograf cekin.' : null,
      recommended_products: geminiResult.recommended_products || [],
      prevention: geminiResult.prevention || '',
      seasonal_alert: false,
      regional_alerts: [],
      harvest_prediction: {
        estimated_days: estimatedDays,
        quality_score: qualityScore,
        quality_label: qualityScore >= 80 ? 'Yuksek' : qualityScore >= 50 ? 'Orta' : 'Dusuk',
        quality_factors: harvestInfo.quality_factors,
        optimal_conditions: harvestInfo.optimal_conditions,
      },
      ai_engine: usedGemini ? 'gemini' : 'local',
      gemini_analysis: usedGemini ? (geminiResult.detailed_analysis || '') : '',
    };

    // Save to history
    if (userId) {
      await AIDiagnosis.create({
        userId,
        disease: response.disease,
        disease_code: response.disease_code,
        confidence,
        treatment: response.treatment,
        stage: response.stage,
        spread_risk: response.spread_risk,
        urgency: response.urgency,
        crop_type: response.crop_type,
        image_url: imageUrl,
      });
    }

    res.json(response);
  } catch (error) {
    console.error('[AI] Diagnose error:', error);
    res.status(500).json({ message: 'AI teshis hatasi', error });
  }
};

// ─── FOLLOW-UP CHAT ENDPOINT ───
export const followUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, context } = req.body;
    if (!question) { res.status(400).json({ message: 'Soru gerekli' }); return; }

    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const contextInfo = context
      ? `Onceki analiz sonucu: Bitki: ${context.crop_type}, Hastalik: ${context.disease}, Tedavi: ${context.treatment}`
      : '';

    const result = await model.generateContent([
      `${FOLLOWUP_SYSTEM}\n\n${contextInfo}\n\nCiftcinin sorusu: ${question}`,
    ]);

    const answer = result.response.text();
    res.json({ answer });
  } catch (error: any) {
    console.error('[Gemini] Follow-up error:', error.message);
    res.status(500).json({ message: 'Yanit alinamadi', error: error.message });
  }
};

// ─── DIAGNOSIS HISTORY ───
export const getDiagnosisHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await AIDiagnosis.find({ userId: req.params.userId as string }).sort({ createdAt: -1 }).limit(20);
    res.json(history);
  } catch (error) { res.status(500).json({ message: 'Gecmis hatasi', error }); }
};

// ─── DISEASE LIBRARY ───
export const getDiseaseLibrary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const season = getCurrentSeason();
    const library = DISEASES.filter(d => d.disease_code !== 'saglikli').map(d => ({
      disease: d.disease, disease_code: d.disease_code, crop_type: d.crop_type,
      urgency: d.urgency, spread_risk: d.spread_risk, treatment: d.treatment,
      recommended_products: d.recommended_products, prevention: d.prevention,
      is_seasonal: d.season.includes(season), active_regions: d.region,
    }));
    res.json({ diseases: library, season, total: library.length });
  } catch (error) { res.status(500).json({ message: 'Kutuphane hatasi', error }); }
};

// ─── REGIONAL ALERTS ───
export const getRegionalAlertsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const region = req.query.region as string || 'Mersin';
    const season = getCurrentSeason();
    const alerts = DISEASES
      .filter(d => d.disease_code !== 'saglikli' && d.season.includes(season) && (d.urgency === 'critical' || (d.spread_risk as string) === 'high'))
      .filter(d => d.region.length === 0 || d.region.some(r => r.toLowerCase().includes(region.toLowerCase())))
      .slice(0, 5)
      .map(d => ({ disease: d.disease, crop_type: d.crop_type, risk_level: d.urgency === 'critical' ? 'high' : 'medium', message: `${d.crop_type} ureticileri dikkat: ${d.disease} su an bolgenizde yaygin.` }));
    res.json({ alerts, region, season });
  } catch (error) { res.status(500).json({ message: 'Uyari hatasi', error }); }
};

// ─── SMART MATCHING ───
export const getSmartMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const disease_code = req.params.disease_code as string;
    const disease = DISEASES.find(d => d.disease_code === disease_code);
    if (!disease) { res.json({ listings: [], professionals: [] }); return; }

    const searchTerms = disease.recommended_products.map(p => p.toLowerCase());
    const cropTerm = disease.crop_type.toLowerCase();

    const listings = await Listing.find({
      status: 'active',
      $or: [
        { title: { $regex: searchTerms.join('|'), $options: 'i' } },
        { description: { $regex: searchTerms.join('|'), $options: 'i' } },
        { title: { $regex: cropTerm, $options: 'i' } },
      ],
    }).sort({ 'stats.views': -1 }).limit(6).select('title price images type sellerName sellerImage location stats').lean();

    const professionals = await Listing.find({
      status: 'active', type: 'isgucu',
      $or: [
        { title: { $regex: 'muhendis|ziraat|ilac', $options: 'i' } },
        { description: { $regex: cropTerm, $options: 'i' } },
      ],
    }).sort({ 'stats.views': -1 }).limit(4).select('title price images type sellerName sellerImage location stats').lean();

    res.json({ listings, professionals, disease_name: disease.disease, crop_type: disease.crop_type });
  } catch (error) { res.status(500).json({ message: 'Eslestirme hatasi', error }); }
};

// ─── HARVEST PREDICTION ───
export const getHarvestPrediction = async (req: Request, res: Response): Promise<void> => {
  try {
    const crop_type = req.params.crop_type as string;
    const harvestInfo = HARVEST_DATA[crop_type] || HARVEST_DATA['Genel'];
    const estimatedDays = Math.floor(Math.random() * (harvestInfo.max_days - harvestInfo.min_days) + harvestInfo.min_days);
    const qualityScore = Math.floor(Math.random() * 25 + 70);
    res.json({
      crop_type, estimated_days: estimatedDays,
      estimated_date: new Date(Date.now() + estimatedDays * 86400000).toISOString().split('T')[0],
      quality_score: qualityScore, quality_label: qualityScore >= 80 ? 'Yuksek' : qualityScore >= 50 ? 'Orta' : 'Dusuk',
      quality_factors: harvestInfo.quality_factors, optimal_conditions: harvestInfo.optimal_conditions, season: getCurrentSeason(),
    });
  } catch (error) { res.status(500).json({ message: 'Hasat tahmini hatasi', error }); }
};
