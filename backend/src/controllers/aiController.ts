import { Request, Response } from 'express';
import fs from 'fs';
import axios from 'axios';
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

// ─── HuggingFace Fallback (Plant Disease Classification) ───
const HF_TOKEN = () => process.env.HF_ACCESS_TOKEN || '';
const HF_MODELS = [
  'ozair23/mobilenet_v2_1.0_224-finetuned-plantdisease',
  'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification',
];

async function analyzeWithHuggingFace(imagePath: string): Promise<{ label: string; score: number }[] | null> {
  const token = HF_TOKEN();
  if (!token) return null;

  const imageBuffer = fs.readFileSync(imagePath);

  for (const model of HF_MODELS) {
    try {
      const { data } = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        imageBuffer,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
          },
          timeout: 30000,
        },
      );
      if (Array.isArray(data) && data.length > 0) {
        return data.slice(0, 5).map((d: any) => ({
          label: d.label || '',
          score: d.score || 0,
        }));
      }
    } catch (err: any) {
      console.error(`[HuggingFace] ${model} error:`, err.message);
      continue; // sonraki modeli dene
    }
  }
  return null;
}

/** HuggingFace label'ini Turkce hastalik eslestirmesine cevir */
function matchHFLabel(label: string): DiseaseEntry | null {
  const lower = label.toLowerCase().replace(/[_-]/g, ' ');
  // Bilinen eslesmeler
  const mappings: Record<string, string> = {
    'tomato late blight': 'domates_mildiyo',
    'tomato early blight': 'domates_yaprak_lekesi',
    'tomato leaf mold': 'domates_yaprak_lekesi',
    'tomato septoria leaf spot': 'domates_yaprak_lekesi',
    'tomato mosaic virus': 'domates_mozaik',
    'tomato yellow leaf curl virus': 'domates_mozaik',
    'pepper bell bacterial spot': 'biber_yaprak_lekesi',
    'potato late blight': 'patates_mildiyo',
    'potato early blight': 'patates_mildiyo',
    'grape black rot': 'bag_mildiyo',
    'grape esca': 'bag_esca',
    'apple scab': 'elma_karaleke',
    'apple black rot': 'elma_karaleke',
    'corn common rust': 'misir_pasi',
    'powdery mildew': 'kulleme',
    'healthy': 'saglikli',
  };

  for (const [key, code] of Object.entries(mappings)) {
    if (lower.includes(key)) {
      return DISEASES.find(d => d.disease_code === code) || null;
    }
  }
  // Genel saglikli kontrolu
  if (lower.includes('healthy')) {
    return DISEASES.find(d => d.disease_code === 'saglikli') || null;
  }
  return null;
}

// ─── COMPREHENSIVE DISEASE DATABASE — 60+ Turkish Agriculture Diseases ───
type DiseaseEntry = { disease: string; disease_code: string; crop_type: string; confidence: number; treatment: string; stage: 'early' | 'mid' | 'advanced'; spread_risk: 'low' | 'medium' | 'high'; urgency: 'low' | 'medium' | 'critical'; season: string[]; region: string[]; recommended_products: string[]; prevention: string };
const DISEASES: DiseaseEntry[] = [
  // ── Zeytin (Olive) ──
  { disease: 'Zeytin Halkali Leke', disease_code: 'zeytin_halkali_leke', crop_type: 'Zeytin', confidence: 92, treatment: 'Bakirli fungisit uygulayın. Enfekte dallari budayin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'autumn'], region: ['Mersin', 'Mugla', 'Aydin', 'Izmir', 'Hatay'], recommended_products: ['Bordo bulamaci', 'Bakirli fungisit', 'Propineb'], prevention: 'Sonbaharda koruyucu bakir ilaclamasi yapin.' },
  { disease: 'Zeytin Sinegi Zarari', disease_code: 'zeytin_sinegi', crop_type: 'Zeytin', confidence: 89, treatment: 'Protein bazli tuzak kapanlari asin. Dimethoate bazli ilac uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'critical', season: ['summer', 'autumn'], region: ['Mersin', 'Mugla', 'Aydin', 'Izmir', 'Balikesir'], recommended_products: ['Dimethoate', 'Feromon tuzagi', 'Kaolin kili'], prevention: 'Feromon tuzaklari kurun. Erken hasat yapin.' },
  { disease: 'Zeytin Dal Kanseri', disease_code: 'zeytin_dal_kanseri', crop_type: 'Zeytin', confidence: 87, treatment: 'Enfekte dallari 20cm saglikli dokudan kesin. Kesim yerlerini macunlayin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'autumn'], region: ['Mugla', 'Aydin', 'Izmir'], recommended_products: ['Bakirli macun', 'Bordo bulamaci'], prevention: 'Budama aletlerini dezenfekte edin.' },
  { disease: 'Zeytin Yaprak Lekesi', disease_code: 'zeytin_yaprak_lekesi', crop_type: 'Zeytin', confidence: 90, treatment: 'Bakirli ilaclar veya Mankozeb uygulayin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['autumn', 'winter', 'spring'], region: ['Hatay', 'Mersin', 'Antalya'], recommended_products: ['Mankozeb', 'Bakirli fungisit', 'Bordo bulamaci'], prevention: 'Agac tacini seyreltip havalandirma saglayin.' },

  // ── Kayisi (Apricot) ──
  { disease: 'Kayisi Monilya', disease_code: 'kayisi_monilya', crop_type: 'Kayisi', confidence: 93, treatment: 'Ciceklenme oncesi ve sonrasi fungisit uygulayin. Mumyalasan meyveleri toplayin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring'], region: ['Malatya', 'Elazig', 'Mersin', 'Icel'], recommended_products: ['Tiofanat metil', 'Iprodion', 'Kaptan'], prevention: 'Kis budamasinda mumya meyveleri uzaklastirin.' },
  { disease: 'Kayisi Yaprak Kivircikligi', disease_code: 'kayisi_yaprak_kivircikligi', crop_type: 'Kayisi', confidence: 88, treatment: 'Goz kabarma doneminde bakirli ilac uygulayin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['spring'], region: ['Malatya', 'Elazig', 'Kayseri'], recommended_products: ['Bordo bulamaci', 'Bakirli fungisit'], prevention: 'Sonbahar yaprak dokumunden sonra bakirli ilac uygulayin.' },
  { disease: 'Kayisi Kahverengi Curume', disease_code: 'kayisi_kahverengi_curume', crop_type: 'Kayisi', confidence: 90, treatment: 'Enfekte meyveleri hemen toplayin. Fungisit uygulayin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Malatya', 'Elazig'], recommended_products: ['Kaptan', 'Tiram', 'Fenheksamid'], prevention: 'Agirlasan dallari destekleyin. Meyve seyreltmesi yapin.' },
  { disease: 'Kayisi Bakteriyel Kanser', disease_code: 'kayisi_bakteriyel_kanser', crop_type: 'Kayisi', confidence: 85, treatment: 'Enfekte dallari kesin. Bakirli preparat uygulayin.', stage: 'advanced', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'autumn'], region: ['Malatya', 'Elazig', 'Mersin'], recommended_products: ['Bordo bulamaci', 'Streptomisin'], prevention: 'Budamayi kuru havalarda yapin. Yara yerlerini macunlayin.' },

  // ── Domates (Tomato) ──
  { disease: 'Domates Mildiyo', disease_code: 'domates_mildiyo', crop_type: 'Domates', confidence: 94, treatment: 'Metalaksil + Mankozeb karisimi uygulayin. Enfekte yapraklari uzaklastirin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Antalya', 'Mersin', 'Bursa', 'Izmir'], recommended_products: ['Metalaksil', 'Mankozeb', 'Fosetil aluminyum', 'Dimetomorf'], prevention: 'Havalandirma saglayin. Damlama sulama kullanin.' },
  { disease: 'Domates Yaprak Lekesi', disease_code: 'domates_yaprak_lekesi', crop_type: 'Domates', confidence: 86, treatment: 'Klorotalonil veya Mankozeb uygulayin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['summer'], region: ['Antalya', 'Mersin', 'Adana'], recommended_products: ['Klorotalonil', 'Bakirli fungisit', 'Mankozeb'], prevention: 'Alt yapraklari budayin. Bitki artiklari temizleyin.' },
  { disease: 'Domates Solgunluk (Fusarium)', disease_code: 'domates_fusarium', crop_type: 'Domates', confidence: 88, treatment: 'Enfekte bitkileri sokun. Toprak dezenfeksiyonu yapin.', stage: 'advanced', spread_risk: 'high', urgency: 'critical', season: ['summer'], region: ['Antalya', 'Mersin'], recommended_products: ['Benomil', 'Toprak dezenfektani', 'Trichoderma'], prevention: 'Dayanikli cesitler ekin. Munavebe yapin.' },
  { disease: 'Domates Mozaik Virusu', disease_code: 'domates_mozaik', crop_type: 'Domates', confidence: 87, treatment: 'Viruslu bitkileri sokun ve imha edin. Vektoru (yaprak biti) kontrol edin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Antalya', 'Mersin', 'Adana'], recommended_products: ['Insektisit (yaprak biti icin)', 'Neem yagi'], prevention: 'Sertifikali tohum kullanin. Aletleri dezenfekte edin.' },
  { disease: 'Domates Kurdu', disease_code: 'domates_kurdu', crop_type: 'Domates', confidence: 91, treatment: 'Tuta absoluta tuzaklari kurun. Biolojik mucadele (Nesidiocoris) kullanin.', stage: 'early', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer', 'autumn'], region: ['Antalya', 'Mersin', 'Adana', 'Izmir'], recommended_products: ['Feromon tuzagi', 'Spinosad', 'Bacillus thuringiensis'], prevention: 'Sera girislerine tul ortu koyun. Feromon tuzak asabilir.' },

  // ── Biber (Pepper) ──
  { disease: 'Biber Antraknoz', disease_code: 'biber_antraknoz', crop_type: 'Biber', confidence: 90, treatment: 'Enfekte meyveleri toplayin. Mankozeb veya Azoksistrobin uygulayin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['summer', 'autumn'], region: ['Antalya', 'Mersin', 'Kahramanmaras', 'Gaziantep'], recommended_products: ['Mankozeb', 'Azoksistrobin', 'Klorotalonil'], prevention: 'Sertifikali tohum kullanin. Munavebe yapin.' },
  { disease: 'Biber Phytophthora Koku Curumesi', disease_code: 'biber_phytophthora', crop_type: 'Biber', confidence: 87, treatment: 'Metalaksil bazli fungisit kokten sulama ile uygulayin.', stage: 'advanced', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Antalya', 'Mersin', 'Adana'], recommended_products: ['Metalaksil', 'Fosetil aluminyum', 'Propamokarb'], prevention: 'Drenaji iyilestirin. Asiri sulamadan kacinin.' },
  { disease: 'Biber Yaprak Lekesi', disease_code: 'biber_yaprak_lekesi', crop_type: 'Biber', confidence: 85, treatment: 'Bakirli fungisit veya Mankozeb uygulayin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['summer'], region: ['Kahramanmaras', 'Gaziantep', 'Sanliurfa'], recommended_products: ['Bakirli fungisit', 'Mankozeb'], prevention: 'Bitki artiklari temizleyin. Sik dikimden kacinin.' },
  { disease: 'Biber Kirmizi Orumcek', disease_code: 'biber_kirmizi_orumcek', crop_type: 'Biber', confidence: 88, treatment: 'Akarisit uygulayin. Yapragi alttan uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'medium', season: ['summer'], region: ['Antalya', 'Mersin', 'Adana'], recommended_products: ['Abamektin', 'Spiromesifen', 'Kufurt'], prevention: 'Nem oranini artirin. Biyolojik mucadele (Phytoseiulus) kullanin.' },
  { disease: 'Biber Mozaik Virusu', disease_code: 'biber_mozaik', crop_type: 'Biber', confidence: 86, treatment: 'Viruslu bitkileri imha edin. Yaprak bitleri kontrol edin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Antalya', 'Mersin', 'Adana', 'Gaziantep'], recommended_products: ['Insektisit', 'Neem yagi', 'Sari yapiskan tuzak'], prevention: 'Dayanikli cesitler secin. Yabanci otlari temizleyin.' },

  // ── Salatalik / Kornison (Cucumber) ──
  { disease: 'Salatalik Kulleme', disease_code: 'salatalik_kulleme', crop_type: 'Salatalik', confidence: 92, treatment: 'Kukurt bazli veya Trifloksistrobin fungisit uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'medium', season: ['spring', 'summer'], region: ['Antalya', 'Mersin', 'Bursa', 'Sakarya'], recommended_products: ['Kukurt', 'Trifloksistrobin', 'Penkonazol'], prevention: 'Havalandirmayi artirin. Dayanikli cesit secin.' },
  { disease: 'Salatalik Mildiyo', disease_code: 'salatalik_mildiyo', crop_type: 'Salatalik', confidence: 90, treatment: 'Metalaksil + Mankozeb uygulayin. Enfekte yapraklari cikartin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Antalya', 'Mersin', 'Bursa'], recommended_products: ['Metalaksil', 'Mankozeb', 'Fosetil aluminyum'], prevention: 'Damlama sulama kullanin. Yapragi islak birakmayin.' },
  { disease: 'Salatalik Mozaik Virusu', disease_code: 'salatalik_mozaik', crop_type: 'Salatalik', confidence: 87, treatment: 'Enfekte bitkileri imha edin. Yaprak bitleri kontrol altina alin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Antalya', 'Mersin'], recommended_products: ['Insektisit', 'Mineral yag', 'Sari yapiskan tuzak'], prevention: 'Sertifikali tohum kullanin. Yabanci ot kontrolu yapin.' },
  { disease: 'Salatalik Solgunluk', disease_code: 'salatalik_solgunluk', crop_type: 'Salatalik', confidence: 85, treatment: 'Enfekte bitkileri sokun. Toprak solarizasyonu yapin.', stage: 'advanced', spread_risk: 'medium', urgency: 'critical', season: ['summer'], region: ['Antalya', 'Bursa'], recommended_products: ['Trichoderma', 'Toprak dezenfektani'], prevention: 'Munavebe yapin. Asiri sulamadan kacinin.' },

  // ── Narenciye (Citrus) ──
  { disease: 'Narenciye Karaleke', disease_code: 'narenciye_karaleke', crop_type: 'Narenciye', confidence: 88, treatment: 'Strobilurin grubu fungisit uygulayin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'summer'], region: ['Mersin', 'Adana', 'Hatay', 'Antalya'], recommended_products: ['Azoksistrobin', 'Mankozeb'], prevention: 'Dusen yapraklari toplayin.' },
  { disease: 'Narenciye Tristeza Virusu', disease_code: 'narenciye_tristeza', crop_type: 'Narenciye', confidence: 85, treatment: 'Enfekte agaclari sokun. Yaprak bitleri ile mucadele edin.', stage: 'advanced', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer', 'autumn', 'winter'], region: ['Mersin', 'Adana', 'Hatay'], recommended_products: ['Insektisit', 'Dayanikli anac'], prevention: 'Sertifikali fidanlar kullanin.' },
  { disease: 'Narenciye Kirmizi Kabuklu Bit', disease_code: 'narenciye_kirmizi_bit', crop_type: 'Narenciye', confidence: 89, treatment: 'Kis yagi + Insektisit karisimi uygulayin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'summer'], region: ['Mersin', 'Adana', 'Antalya'], recommended_products: ['Kis yagi', 'Spirotetramat', 'Buprofezin'], prevention: 'Budamayla havalandirma saglayin.' },
  { disease: 'Narenciye Mal Secco', disease_code: 'narenciye_malsecco', crop_type: 'Narenciye', confidence: 86, treatment: 'Enfekte dallari kesin. Bakirli ilac uygulayin.', stage: 'mid', spread_risk: 'medium', urgency: 'critical', season: ['autumn', 'winter', 'spring'], region: ['Mersin', 'Adana', 'Hatay'], recommended_products: ['Bordo bulamaci', 'Bakirli fungisit'], prevention: 'Budamayi kuru havalarda yapin.' },

  // ── Uzum (Grape) ──
  { disease: 'Bag Kulleme', disease_code: 'bag_kulleme', crop_type: 'Uzum', confidence: 91, treatment: 'Kukurt bazli ilac uygulayin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'summer'], region: ['Manisa', 'Denizli', 'Mersin', 'Elazig'], recommended_products: ['Kukurt', 'Trifloksistrobin', 'Penkonazol'], prevention: 'Yaprak seyreltme yapin.' },
  { disease: 'Bag Mildiyo', disease_code: 'bag_mildiyo', crop_type: 'Uzum', confidence: 89, treatment: 'Bordo bulamaci uygulayin. Metalaksil kullanin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Manisa', 'Denizli', 'Mersin'], recommended_products: ['Bordo bulamaci', 'Metalaksil', 'Mankozeb'], prevention: 'Drenaji iyilestirin. Yaprak seyreltmesi yapin.' },
  { disease: 'Bag Kurumu (Esca)', disease_code: 'bag_esca', crop_type: 'Uzum', confidence: 84, treatment: 'Enfekte kollari kesin. Yara yerlerini macunlayin.', stage: 'advanced', spread_risk: 'low', urgency: 'medium', season: ['summer'], region: ['Manisa', 'Denizli'], recommended_products: ['Trichoderma', 'Yara macunu'], prevention: 'Budama yaralarini koruyun.' },
  { disease: 'Bag Salkum Guv', disease_code: 'bag_salkimguv', crop_type: 'Uzum', confidence: 88, treatment: 'Salkimlara Bacillus thuringiensis veya Indoksakarb uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'critical', season: ['summer'], region: ['Manisa', 'Denizli', 'Elazig', 'Gaziantep'], recommended_products: ['Bacillus thuringiensis', 'Indoksakarb', 'Feromon tuzagi'], prevention: 'Feromon tuzaklari kurun.' },

  // ── Bugday / Tahil (Wheat/Grain) ──
  { disease: 'Bugday Pasi', disease_code: 'bugday_pasi', crop_type: 'Bugday', confidence: 91, treatment: 'Tebukonazol veya Propikonazol uygulayin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring'], region: ['Konya', 'Ankara', 'Eskisehir', 'Diyarbakir'], recommended_products: ['Tebukonazol', 'Propikonazol', 'Trifloksistrobin'], prevention: 'Dayanikli cesitler ekin. Erken ekim yapin.' },
  { disease: 'Bugday Surmesi', disease_code: 'bugday_surmesi', crop_type: 'Bugday', confidence: 87, treatment: 'Tohum ilaclamasi yapin. Karboksin + Tiram kullanin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['autumn', 'spring'], region: ['Konya', 'Ankara', 'Cankiri'], recommended_products: ['Karboksin', 'Tiram', 'Tohum ilaci'], prevention: 'Sertifikali tohum kullanin.' },

  // ── Patates (Potato) ──
  { disease: 'Patates Mildiyo', disease_code: 'patates_mildiyo', crop_type: 'Patates', confidence: 93, treatment: 'Metalaksil + Mankozeb uygulayin. 7-10 gun arayla tekrarlayin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Nigde', 'Nevsehir', 'Bolu', 'Izmir'], recommended_products: ['Metalaksil', 'Mankozeb', 'Simekonazol'], prevention: 'Dayanikli cesitler secin. Drenaji duzeltin.' },
  { disease: 'Patates Bozu', disease_code: 'patates_bozu', crop_type: 'Patates', confidence: 90, treatment: 'Colorado bocegiyle biyolojik mucadele. Spinosad uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Nigde', 'Nevsehir', 'Bolu'], recommended_products: ['Spinosad', 'Neonikotinoid', 'Bacillus thuringiensis'], prevention: 'El ile toplama. Munavebe yapin.' },

  // ── Elma (Apple) ──
  { disease: 'Elma Karaleke', disease_code: 'elma_karaleke', crop_type: 'Elma', confidence: 92, treatment: 'Kaptan veya Ditianon uygulayin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Isparta', 'Karaman', 'Nigde', 'Kastamonu'], recommended_products: ['Kaptan', 'Ditianon', 'Mankozeb'], prevention: 'Dusen yapraklari toplayin. Koruyucu ilaclama yapin.' },
  { disease: 'Elma Kulleme', disease_code: 'elma_kulleme', crop_type: 'Elma', confidence: 89, treatment: 'Penkonazol veya Kukurt uygulayin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['spring'], region: ['Isparta', 'Karaman'], recommended_products: ['Penkonazol', 'Kukurt', 'Trifloksistrobin'], prevention: 'Enfekte surguleri budayin.' },
  { disease: 'Elma Icikurdu', disease_code: 'elma_icikurdu', crop_type: 'Elma', confidence: 90, treatment: 'Klorantraniliprol veya Indoksakarb uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Isparta', 'Karaman', 'Nigde'], recommended_products: ['Klorantraniliprol', 'Indoksakarb', 'Feromon tuzagi'], prevention: 'Feromon tuzaklari kurun. Dokulen meyveleri toplayin.' },

  // ── Findik (Hazelnut) ──
  { disease: 'Findik Kurdu', disease_code: 'findik_kurdu', crop_type: 'Findik', confidence: 91, treatment: 'Ceviz icikurdu ilaci uygulayin. Lambda sihalotrin kullanin.', stage: 'early', spread_risk: 'high', urgency: 'critical', season: ['spring', 'summer'], region: ['Trabzon', 'Ordu', 'Giresun', 'Sakarya', 'Duzce'], recommended_products: ['Lambda sihalotrin', 'Deltametrin', 'Feromon tuzagi'], prevention: 'Dokulen findiklari toplayin.' },
  { disease: 'Findik Kulleme', disease_code: 'findik_kulleme', crop_type: 'Findik', confidence: 87, treatment: 'Kukurt bazli fungisit uygulayin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'summer'], region: ['Trabzon', 'Ordu', 'Giresun'], recommended_products: ['Kukurt', 'Penkonazol'], prevention: 'Havalandirma icin budama yapin.' },
  { disease: 'Findik Bakteriyel Yanikligi', disease_code: 'findik_bakteriyel_yaniklik', crop_type: 'Findik', confidence: 85, treatment: 'Enfekte dallari kesin. Bakirli ilac uygulayin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['spring'], region: ['Trabzon', 'Ordu', 'Giresun', 'Sakarya'], recommended_products: ['Bordo bulamaci', 'Bakirli fungisit'], prevention: 'Budama aletlerini dezenfekte edin.' },

  // ── Cay (Tea) ──
  { disease: 'Cay Yaprak Yanigi', disease_code: 'cay_yaprak_yanigi', crop_type: 'Cay', confidence: 86, treatment: 'Bakirli fungisit uygulayin. Enfekte yapraklari uzaklastirin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'summer'], region: ['Rize', 'Trabzon', 'Artvin'], recommended_products: ['Bakirli fungisit', 'Bordo bulamaci'], prevention: 'Budama ile havalandirma saglayin.' },
  { disease: 'Cay Kirmizi Orumcek', disease_code: 'cay_kirmizi_orumcek', crop_type: 'Cay', confidence: 88, treatment: 'Akarisit uygulayin. Yaprak altlarindan uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'medium', season: ['summer'], region: ['Rize', 'Trabzon'], recommended_products: ['Abamektin', 'Kukurt'], prevention: 'Nem oranini artirin. Agir budamadan kacinin.' },

  // ── Pamuk (Cotton) ──
  { disease: 'Pamuk Solgunlugu (Verticillium)', disease_code: 'pamuk_verticillium', crop_type: 'Pamuk', confidence: 88, treatment: 'Dayanikli cesitler ekin. Toprak dezenfeksiyonu yapin.', stage: 'advanced', spread_risk: 'high', urgency: 'critical', season: ['summer'], region: ['Adana', 'Sanliurfa', 'Hatay', 'Aydin'], recommended_products: ['Toprak dezenfektani', 'Trichoderma'], prevention: 'Munavebe yapin. Toprak analizini kontrol edin.' },
  { disease: 'Pamuk Yaprak Kurdu', disease_code: 'pamuk_yaprak_kurdu', crop_type: 'Pamuk', confidence: 89, treatment: 'Biyolojik mucadele. Bacillus thuringiensis uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'critical', season: ['summer'], region: ['Adana', 'Sanliurfa', 'Hatay'], recommended_products: ['Bacillus thuringiensis', 'Spinosad', 'Indoksakarb'], prevention: 'Feromon tuzaklari kurun.' },

  // ── Misir (Corn) ──
  { disease: 'Misir Kocan Kurdu', disease_code: 'misir_kocan_kurdu', crop_type: 'Misir', confidence: 90, treatment: 'Trichogramma salimi yapin. Insektisit uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'critical', season: ['summer'], region: ['Adana', 'Sakarya', 'Antalya'], recommended_products: ['Trichogramma', 'Klorpirifos', 'Indoksakarb'], prevention: 'Bitki artiklari imha edin. Erken ekim yapin.' },
  { disease: 'Misir Pasi', disease_code: 'misir_pasi', crop_type: 'Misir', confidence: 87, treatment: 'Azoksistrobin veya Propikonazol uygulayin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['summer'], region: ['Adana', 'Sakarya'], recommended_products: ['Azoksistrobin', 'Propikonazol'], prevention: 'Dayanikli cesitler ekin.' },

  // ── Nar (Pomegranate) ──
  { disease: 'Nar Leke Hastaligi', disease_code: 'nar_leke', crop_type: 'Nar', confidence: 87, treatment: 'Bakirli fungisit uygulayin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'summer'], region: ['Antalya', 'Mersin', 'Mugla'], recommended_products: ['Bakirli fungisit', 'Mankozeb'], prevention: 'Budamayla havalandirma saglayin.' },
  { disease: 'Nar Icikurdu', disease_code: 'nar_icikurdu', crop_type: 'Nar', confidence: 89, treatment: 'Enfekte meyveleri toplayin. Insektisit uygulayin.', stage: 'mid', spread_risk: 'high', urgency: 'critical', season: ['summer', 'autumn'], region: ['Antalya', 'Mersin', 'Hatay'], recommended_products: ['Deltametrin', 'Spinosad'], prevention: 'Dokulen meyveleri toplayin ve imha edin.' },

  // ── Kabak / Kavun / Karpuz (Cucurbits) ──
  { disease: 'Kabak Kulleme', disease_code: 'kabak_kulleme', crop_type: 'Kabak', confidence: 91, treatment: 'Kukurt veya Penkonazol uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'medium', season: ['summer'], region: ['Antalya', 'Mersin', 'Adana'], recommended_products: ['Kukurt', 'Penkonazol', 'Trifloksistrobin'], prevention: 'Dayanikli cesit secin. Sik dikimden kacinin.' },
  { disease: 'Karpuz Fusarium Solgunlugu', disease_code: 'karpuz_fusarium', crop_type: 'Karpuz', confidence: 86, treatment: 'Asili fide kullanin. Toprak solarizasyonu yapin.', stage: 'advanced', spread_risk: 'high', urgency: 'critical', season: ['summer'], region: ['Adana', 'Antalya', 'Diyarbakir'], recommended_products: ['Asili fide', 'Trichoderma', 'Toprak dezenfektani'], prevention: '5 yil ayni yere ekmein. Munavebe yapin.' },

  // ── Genel (General) ──
  { disease: 'Yaprak Yanikligi', disease_code: 'yaprak_yanikligi', crop_type: 'Genel', confidence: 92, treatment: 'Bakirli fungisit uygulayin.', stage: 'mid', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'summer', 'autumn'], region: [], recommended_products: ['Bakirli fungisit', 'Mankozeb'], prevention: 'Bitki artiklarini temizleyin.' },
  { disease: 'Kulleme', disease_code: 'kulleme', crop_type: 'Genel', confidence: 88, treatment: 'Kukurt bazli fungisit kullanin.', stage: 'early', spread_risk: 'medium', urgency: 'medium', season: ['spring', 'summer'], region: [], recommended_products: ['Kukurt', 'Triadimefon'], prevention: 'Havalandirmayi artirin.' },
  { disease: 'Kok Curumesi', disease_code: 'kok_curumesi', crop_type: 'Genel', confidence: 86, treatment: 'Sulama programini duzenleyin. Fungisit uygulayin.', stage: 'advanced', spread_risk: 'medium', urgency: 'critical', season: ['spring', 'summer', 'autumn'], region: [], recommended_products: ['Metalaksil', 'Fosetil aluminyum', 'Trichoderma'], prevention: 'Asiri sulamadan kacinin. Drenaji duzeltin.' },
  { disease: 'Yaprak Biti', disease_code: 'yaprak_biti', crop_type: 'Genel', confidence: 90, treatment: 'Insektisit veya sabunlu su uygulayin. Neem yagi etkilidir.', stage: 'early', spread_risk: 'high', urgency: 'medium', season: ['spring', 'summer'], region: [], recommended_products: ['Neem yagi', 'Piretrin', 'Sari yapiskan tuzak', 'Insektisit sabun'], prevention: 'Dogal dusmanlar (ugur bocegi) koruyun.' },
  { disease: 'Beyaz Sinek', disease_code: 'beyaz_sinek', crop_type: 'Genel', confidence: 89, treatment: 'Sari yapiskan tuzak asin. Insektisit uygulayin.', stage: 'early', spread_risk: 'high', urgency: 'medium', season: ['spring', 'summer'], region: [], recommended_products: ['Sari yapiskan tuzak', 'Imidakloprid', 'Spiromesifen'], prevention: 'Sera girislerine tul takin. Yabani otlari temizleyin.' },
  { disease: 'Besin Eksikligi (Azot)', disease_code: 'azot_eksikligi', crop_type: 'Genel', confidence: 85, treatment: 'Azotlu gubre (urea veya amonyum nitrat) uygulayin.', stage: 'early', spread_risk: 'low', urgency: 'medium', season: ['spring', 'summer'], region: [], recommended_products: ['Urea', 'Amonyum nitrat', 'Yaprak gubresi'], prevention: 'Toprak analizine gore gubreleme yapin.' },
  { disease: 'Besin Eksikligi (Demir)', disease_code: 'demir_eksikligi', crop_type: 'Genel', confidence: 84, treatment: 'Demir selat iceren yaprak gubresi uygulayin. Toprak pH duzenlein.', stage: 'early', spread_risk: 'low', urgency: 'low', season: ['spring', 'summer'], region: [], recommended_products: ['Demir selat', 'Yaprak gubresi', 'Kukurt (pH icin)'], prevention: 'Toprak pH\'ini 6-7 araliginda tutun.' },
  { disease: 'Saglikli Bitki', disease_code: 'saglikli', crop_type: 'Genel', confidence: 96, treatment: 'Bitkiniz saglikli gorunuyor!', stage: 'early', spread_risk: 'low', urgency: 'low', season: ['spring', 'summer', 'autumn', 'winter'], region: [], recommended_products: [], prevention: 'Duzenli gubreleme ve sulama programina sadik kalin.' },
];

// ─── HARVEST PREDICTION DATABASE ───
const HARVEST_DATA: Record<string, { min_days: number; max_days: number; quality_factors: string[]; optimal_conditions: string }> = {
  'Domates': { min_days: 60, max_days: 90, quality_factors: ['Renk koyulugu', 'Sertlik', 'Buyukluk'], optimal_conditions: 'Gunduz 25-30C, gece 15-18C' },
  'Zeytin': { min_days: 150, max_days: 210, quality_factors: ['Meyve buyuklugu', 'Yag orani', 'Renk donusumu'], optimal_conditions: 'Sicak yaz, iliman sonbahar' },
  'Narenciye': { min_days: 180, max_days: 300, quality_factors: ['Kabuk rengi', 'Meyve agirligi', 'Seker/asit orani'], optimal_conditions: 'Iliman kis, sicak yaz' },
  'Uzum': { min_days: 100, max_days: 150, quality_factors: ['Seker orani', 'Tane sertligi', 'Salkim dolgunlugu'], optimal_conditions: 'Sicak gunduz, serin gece' },
  'Kayisi': { min_days: 90, max_days: 120, quality_factors: ['Renk', 'Sertlik', 'Aroma'], optimal_conditions: 'Sicak gunduz, serin gece, az yagis' },
  'Biber': { min_days: 60, max_days: 90, quality_factors: ['Renk parlaklik', 'Sertlik', 'Boyut'], optimal_conditions: 'Gunduz 25-30C, gece 18-20C' },
  'Salatalik': { min_days: 45, max_days: 70, quality_factors: ['Boyut', 'Renk', 'Sertlik'], optimal_conditions: 'Gunduz 22-28C, yuksek nem' },
  'Bugday': { min_days: 120, max_days: 150, quality_factors: ['Tane dolgunlugu', 'Nem orani', 'Protein'], optimal_conditions: 'Iliman ilkbahar, kurak hasat donemi' },
  'Patates': { min_days: 90, max_days: 120, quality_factors: ['Yumru buyuklugu', 'Kabuk kalitesi', 'Nisasta'], optimal_conditions: 'Serin iklim, duzenli nem' },
  'Elma': { min_days: 120, max_days: 180, quality_factors: ['Renk', 'Sertlik', 'Seker/asit dengesi'], optimal_conditions: 'Soguk kis, iliman yaz' },
  'Findik': { min_days: 150, max_days: 180, quality_factors: ['Ic dolgunlugu', 'Yag orani', 'Kabuk kalinligi'], optimal_conditions: 'Nemli iklim, iliman yaz' },
  'Nar': { min_days: 150, max_days: 180, quality_factors: ['Tane rengi', 'Seker orani', 'Kabuk rengi'], optimal_conditions: 'Sicak yaz, iliman sonbahar' },
  'Pamuk': { min_days: 150, max_days: 180, quality_factors: ['Lif uzunlugu', 'Lif kalitesi', 'Koza dolgunlugu'], optimal_conditions: 'Sicak ve kurak' },
  'Misir': { min_days: 90, max_days: 120, quality_factors: ['Kocan dolgunlugu', 'Tane buyuklugu', 'Nem'], optimal_conditions: 'Sicak yaz, yeterli nem' },
  'Karpuz': { min_days: 70, max_days: 90, quality_factors: ['Boyut', 'Seker orani', 'Kabuk rengi'], optimal_conditions: 'Sicak gunler, serin geceler' },
  'Cay': { min_days: 30, max_days: 45, quality_factors: ['Yaprak tazeligi', 'Surgun uzunlugu', 'Renk'], optimal_conditions: 'Nemli, iliman iklim' },
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

    // ─── AI Analysis: Gemini (primary) → HuggingFace (fallback) ───
    let geminiResult = await analyzeWithGemini(imagePath);
    let usedGemini = !!geminiResult;
    let hfClassifications: { label: string; score: number }[] | null = null;
    let usedHF = false;

    // Gemini basarisizsa HuggingFace'e gec
    if (!geminiResult) {
      console.log('[AI] Gemini failed, trying HuggingFace fallback...');
      hfClassifications = await analyzeWithHuggingFace(imagePath);

      if (hfClassifications && hfClassifications.length > 0) {
        usedHF = true;
        const topResult = hfClassifications[0];
        const matched = matchHFLabel(topResult.label);

        if (matched) {
          geminiResult = {
            crop_type: matched.crop_type,
            disease: matched.disease,
            disease_code: matched.disease_code,
            confidence: Math.round(topResult.score * 100),
            stage: matched.stage,
            spread_risk: matched.spread_risk,
            urgency: matched.urgency,
            treatment: matched.treatment,
            recommended_products: matched.recommended_products,
            prevention: matched.prevention,
            detailed_analysis: `HuggingFace siniflandirmasi: ${topResult.label} (%${(topResult.score * 100).toFixed(1)} guven). ${matched.treatment}`,
          };
        } else {
          // Eslestirilemedi ama sonuc var
          geminiResult = {
            crop_type: 'Genel',
            disease: topResult.label.replace(/_/g, ' '),
            disease_code: 'bilinmeyen',
            confidence: Math.round(topResult.score * 100),
            stage: 'mid',
            spread_risk: 'medium',
            urgency: 'medium',
            treatment: 'Detayli analiz icin ziraat muhendisine danisin.',
            recommended_products: [],
            prevention: 'Duzenli kontrol yapin.',
            detailed_analysis: `HuggingFace siniflandirmasi: ${hfClassifications.map(c => `${c.label} (%${(c.score * 100).toFixed(1)})`).join(', ')}`,
          };
        }
      }
    }

    // Her iki AI de basarisizsa hata don
    if (!geminiResult) {
      res.status(503).json({
        message: 'AI analiz servisi su an kullanilamamaktadir. Lutfen daha sonra tekrar deneyin.',
        ai_engine: 'none',
        error_code: 'AI_UNAVAILABLE',
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
      ai_engine: usedGemini ? 'gemini' : usedHF ? 'huggingface' : 'local',
      gemini_analysis: geminiResult.detailed_analysis || '',
      hf_classifications: hfClassifications || undefined,
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
