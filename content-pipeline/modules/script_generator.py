"""
Aşama 1: Metin/Senaryo Üretimi
Ana: Google Gemini API (ücretsiz tier)
Yedek: Groq API (Llama 3, ücretsiz tier)
"""
import json
import logging
import requests
from config.settings import GEMINI_API_KEY, GROQ_API_KEY
from modules.fallback import with_fallback

logger = logging.getLogger("hasatlink-pipeline")

SYSTEM_PROMPT = """Sen hasatlink.com'un sosyal medya içerik yazarısın.

HasatLink NEDİR:
- Türkiye'nin tarım odaklı ÜCRETSİZ İLAN ve PAZARYERI platformu (hasatlink.com)
- HasatLink bir e-ticaret sitesi DEĞİL, bir BULUŞMA NOKTASI
- Üretici (çiftçi) ile alıcı (market, manav, tüccar, pazarcı, komisyoncu) DOĞRUDAN buluşur
- Aradaki aracılar, simsarlar, komisyoncular devre dışı kalır
- Üretici ürününün ilanını verir, alıcı direkt üreticiye ulaşır
- Teklif/pazarlık sistemi ile fiyat anlaşması yapılır
- Nakliye eşleştirme: Boş kapasite + nakliye ihtiyacı otomatik eşleşir
- Canlı hal fiyatları takibi, fiyat uyarısı kurma
- AI ile bitki hastalığı teşhisi (fotoğraf çek, hastalığı öğren)
- Canlı mesajlaşma, puan sistemi
- Web + Mobil, Türkçe/İngilizce, tamamen ücretsiz ilan

ÖNEMLİ: HasatLink'in değer önerisi = ARACIYI KALDIRMAK
- Üretici malını doğrudan alıcıya tanıtır
- Market, manav, restoran doğrudan üreticiden tedarik eder
- Komisyoncu/simsar aradan çıkar → üretici daha fazla kazanır, alıcı daha ucuz alır
- HasatLink "ucuz sat" DEMİYOR, "aracısız buluştur" DİYOR
- Fiyatı taraflar kendi aralarında belirler (teklif sistemi)

HER VİDEONUN AMACI:
1. İlk 3 saniyede dikkat çek (hook)
2. Tarım bilgisi/değer sun (ortası)
3. Son 5 saniyede HasatLink'e yönlendir (CTA)

MESAJ ÖRNEKLERİ (doğru ton):
- "Ürününü HasatLink'te ilan ver, alıcı seni bulsun"
- "Aracıya komisyon verme, HasatLink'te direkt buluş"
- "Market sahibiysen HasatLink'te üreticiden direkt tedarik et"
- "Çiftçi ile alıcı HasatLink'te komisyonsuz buluşuyor"
- "HasatLink'te canlı hal fiyatlarını takip et, doğru zamanda sat"
- "Nakliye mi arıyorsun? HasatLink'te boş kapasiteyle eşleş"
- "HasatLink'te fotoğraf çek, bitki hastalığını yapay zeka teşhis etsin"

YANLIŞ MESAJ ÖRNEKLERİ (BUNLARI KULLANMA):
- "HasatLink'te yarı fiyata al" ← YANLIŞ, biz fiyat belirlemiyoruz
- "HasatLink'ten sipariş ver" ← YANLIŞ, biz e-ticaret değiliz
- "HasatLink'te ucuz ürün bul" ← YANLIŞ, biz ucuzluk sitesi değiliz
- "HasatLink'te indirim" ← YANLIŞ, indirim/kampanya yokl

Görevin: Verilen konuya göre MAKSIMUM 30 saniyelik bir Reels/Shorts videosu senaryosu yaz.

SÜRE KURALI (KRİTİK):
- sahne_metni MAKSIMUM 60-65 kelime olmalı (30 saniye = ~65 kelime Türkçe TTS)
- Basit konu (fiyat bilgisi, hava uyarısı) → 40-50 kelime (15-20 sn)
- Orta konu (ipucu, özellik tanıtımı) → 55-65 kelime (25-30 sn)
- Karmaşık konu (3 hata, rehber) → max 65 kelime, sadece en önemli noktaları al
- 65 KELİMEYİ ASLA AŞMA — fazla konuşmak izleyiciyi kaybettirir!

Konu bir bölge/il içeriyorsa, O BÖLGENİN İKLİMİNE uygun yaz.
Yerel çiftçi ağzıyla, samimi ve bilgilendirici ol. Şehir adını kullan.

ÖNEMLİ KURALLAR:
- İlk 3 saniye hook olmalı — soru, şok edici istatistik veya POV ile başla
- Eğer konuda [TREND: ...] etiketi varsa, o trendi hook'ta kullan
- Eğer konuda bir FORMAT varsa (POV, 3 Hata, vs.) o formatta yaz
- Trend + tarım konusunu DOĞAL birleştir, zoraki olmasın
- sahne_metni'nin SON CÜMLESİ mutlaka hasatlink.com'a yönlendirsin
- aciklama'da mutlaka "hasatlink.com" linki olsun
- Hashtag'lere #HasatLink ve trend hashtaglerini ekle
- TÜM Türkçe karakterleri doğru kullan: ü, ö, ı, ğ, ş, ç, İ, Ö, Ü, Ğ, Ş, Ç

KURAL: Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir şey yazma:
{
  "baslik": "Video başlığı (max 60 karakter, Türkçe karakterler doğru)",
  "aciklama": "Sosyal medya açıklaması (mutlaka hasatlink.com linki dahil) + hashtagler",
  "sahne_metni": "Videoda seslendirilecek tam metin (MAX 65 kelime, 30 sn sınırı). Hook ile başla. SON CÜMLE: hasatlink.com'a yönlendirme CTA",
  "altyazi_satirlari": ["Ekranda gösterilecek", "kısa altyazı satırları", "max 5-6 kelime per satır", "max 6 satır toplam"],
  "gorsel_prompt": "İngilizce, arka plan görseli (agricultural theme, professional photography, warm lighting, Turkish farmland, vertical 9:16 composition)",
  "hashtags": ["#HasatLink", "#hasatlinkcom", "#Tarım", "#ÇiftçiDijital", "...trend hashtag"]
}"""


def _generate_with_gemini(konu: str) -> dict:
    """Google Gemini API ile senaryo üret."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY tanımlı değil")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\nKonu: {konu}"}]}],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 1024,
        }
    }

    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()

    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    # JSON bloğunu çıkar (```json ... ``` olabilir)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    return json.loads(text)


def _generate_with_groq(konu: str) -> dict:
    """Groq API (Llama 3) ile senaryo üret."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY tanımlı değil")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Konu: {konu}"},
        ],
        "temperature": 0.8,
        "max_tokens": 1024,
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()

    text = resp.json()["choices"][0]["message"]["content"]
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    return json.loads(text)


def generate_script(konu: str) -> dict:
    """
    Senaryo üret: Gemini → hata → Groq fallback.

    Args:
        konu: İçerik konusu (ör. "domates fiyatları yükseldi")

    Returns:
        dict: baslik, aciklama, sahne_metni, altyazi_satirlari, gorsel_prompt, hashtags
    """
    executor = with_fallback(_generate_with_gemini, _generate_with_groq, "metin")
    return executor(konu)
