"""
Trend Takip Modülü
TikTok, Instagram, Twitter/X, Google Trends'ten günlük akımları çeker.
Ücretsiz kaynaklar + scraping ile çalışır.

Kaynaklar:
  1. Google Trends (pytrends) — Türkiye günlük arama trendleri
  2. TikTok Discover — Trending hashtag ve sesler
  3. Twitter/X Trends — Türkiye trending topic
  4. YouTube Trending — Trending videolar
  5. Reddit — Popüler postlar (global trend sinyali)
"""
import json
import logging
import random
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from config.settings import BASE_DIR

logger = logging.getLogger("hasatlink-pipeline")

TREND_CACHE_FILE = BASE_DIR / "output" / "trend_cache.json"
CACHE_TTL_HOURS = 6  # 6 saatte bir yenile


def _load_cache() -> dict | None:
    """Trend cache'i oku, TTL geçmişse None dön."""
    if not TREND_CACHE_FILE.exists():
        return None
    try:
        data = json.loads(TREND_CACHE_FILE.read_text(encoding="utf-8"))
        cached_at = datetime.fromisoformat(data.get("cached_at", "2000-01-01"))
        if datetime.now() - cached_at < timedelta(hours=CACHE_TTL_HOURS):
            return data
    except Exception:
        pass
    return None


def _save_cache(data: dict):
    """Trend verisini cache'e yaz."""
    data["cached_at"] = datetime.now().isoformat()
    TREND_CACHE_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ============================================================
# KAYNAK 1: Google Trends (Türkiye)
# ============================================================
def _fetch_google_trends() -> list[dict]:
    """Google Trends günlük artan aramalar (Türkiye)."""
    trends = []
    try:
        import requests
        # Google Trends RSS — günlük trending aramalar
        url = "https://trends.google.com/trending/rss?geo=TR"
        resp = requests.get(url, timeout=15, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        resp.raise_for_status()

        # Basit XML parse (dependency azaltmak için regex)
        titles = re.findall(r"<title><!\[CDATA\[(.+?)\]\]></title>", resp.text)
        traffic = re.findall(r"ht:approx_traffic>(.+?)</ht:approx_traffic", resp.text)

        for i, title in enumerate(titles[:20]):
            volume = traffic[i] if i < len(traffic) else "?"
            trends.append({
                "source": "google_trends",
                "keyword": title.strip(),
                "volume": volume,
                "type": "search_trend",
            })

        logger.info(f"Google Trends: {len(trends)} trend bulundu")
    except Exception as e:
        logger.warning(f"Google Trends çekilemedi: {e}")

    return trends


# ============================================================
# KAYNAK 2: TikTok Trending (Discover page scrape)
# ============================================================
def _fetch_tiktok_trends() -> list[dict]:
    """TikTok trending hashtag ve sesler."""
    trends = []
    try:
        import requests
        # TikTok'un research API'si (ücretsiz, sınırlı)
        # Alternatif: trending hashtag sayfası
        url = "https://www.tiktok.com/api/trending/hashtag/?count=20&lang=tr"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }
        resp = requests.get(url, headers=headers, timeout=15)

        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("hashtag_list", data.get("body", {}).get("hashtagList", [])):
                name = item.get("hashtag_name", item.get("hashtagName", ""))
                if name:
                    trends.append({
                        "source": "tiktok",
                        "keyword": f"#{name}",
                        "volume": item.get("view_count", item.get("stats", {}).get("viewCount", "?")),
                        "type": "hashtag",
                    })

        logger.info(f"TikTok: {len(trends)} trend bulundu")
    except Exception as e:
        logger.warning(f"TikTok trendleri çekilemedi: {e}")

    return trends


# ============================================================
# KAYNAK 3: Twitter/X Trends (Türkiye)
# ============================================================
def _fetch_twitter_trends() -> list[dict]:
    """Twitter/X Türkiye trending topics (ücretsiz scrape)."""
    trends = []
    try:
        import requests
        # Ücretsiz Twitter trends API alternatifleri
        urls = [
            "https://api.trending-topics.org/v1/trending/turkey",
            "https://getdaytrends.com/turkey/",
        ]

        for url in urls:
            try:
                resp = requests.get(url, timeout=10, headers={
                    "User-Agent": "Mozilla/5.0"
                })
                if resp.status_code == 200:
                    if "json" in resp.headers.get("content-type", ""):
                        data = resp.json()
                        for item in data.get("trends", [])[:15]:
                            trends.append({
                                "source": "twitter",
                                "keyword": item.get("name", item.get("topic", "")),
                                "volume": item.get("tweet_volume", "?"),
                                "type": "topic",
                            })
                    else:
                        # HTML scrape
                        hashtags = re.findall(r'#(\w+)', resp.text)
                        topics = re.findall(r'trending-topic[^>]*>([^<]+)', resp.text)
                        for tag in (hashtags + topics)[:15]:
                            if len(tag) > 2:
                                trends.append({
                                    "source": "twitter",
                                    "keyword": tag if tag.startswith("#") else f"#{tag}",
                                    "volume": "?",
                                    "type": "topic",
                                })
                    if trends:
                        break
            except Exception:
                continue

        logger.info(f"Twitter: {len(trends)} trend bulundu")
    except Exception as e:
        logger.warning(f"Twitter trendleri çekilemedi: {e}")

    return trends


# ============================================================
# KAYNAK 4: YouTube Trending (Türkiye)
# ============================================================
def _fetch_youtube_trends() -> list[dict]:
    """YouTube Türkiye trending video başlıkları."""
    trends = []
    try:
        import requests
        # YouTube trending page scrape
        resp = requests.get(
            "https://www.youtube.com/feed/trending",
            headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "tr-TR,tr;q=0.9"},
            timeout=15,
        )
        if resp.status_code == 200:
            # Video başlıklarını çıkar
            titles = re.findall(r'"title":\{"runs":\[\{"text":"([^"]+)"\}', resp.text)
            for title in titles[:15]:
                trends.append({
                    "source": "youtube",
                    "keyword": title,
                    "volume": "?",
                    "type": "video_title",
                })
        logger.info(f"YouTube: {len(trends)} trend bulundu")
    except Exception as e:
        logger.warning(f"YouTube trendleri çekilemedi: {e}")

    return trends


# ============================================================
# KAYNAK 5: Hardcoded Evergreen Akımlar (Fallback)
# Sosyal medyada her zaman dönen format/akım tipleri
# ============================================================
EVERGREEN_FORMATS = [
    {
        "format": "POV",
        "template": "POV: {konu} — hasatlink.com'da cozum var",
        "aciklama": "Birinci şahıs bakış açısı + HasatLink CTA",
        "ornek": "POV: Çiftçi HasatLink'te ilk satışını yapıyor",
    },
    {
        "format": "Bunu Biliyor muydun?",
        "template": "Bunu Biliyor muydun? {bilgi} — hasatlink.com",
        "aciklama": "Şaşırtıcı tarım bilgisi + platform yönlendirme",
        "ornek": "Bunu Biliyor muydun? HasatLink'te AI ile bitki hastalığı teşhis ediliyor",
    },
    {
        "format": "3 Hata",
        "template": "{konu} yaparken yapilan 3 buyuk hata — HasatLink'te dogrusunu ogren",
        "aciklama": "Eğitici hata listesi + HasatLink çözüm",
        "ornek": "Ürün satarken yapılan 3 hata — HasatLink ile aracısız sat",
    },
    {
        "format": "Before/After",
        "template": "Once vs Sonra: {konu} — HasatLink farki",
        "aciklama": "Aracılı vs aracısız buluşma karşılaştırması",
        "ornek": "Önce: Aracıya komisyon / Sonra: HasatLink'te direkt buluşma",
    },
    {
        "format": "1 Dakikada",
        "template": "1 Dakikada {konu} ogren! hasatlink.com",
        "aciklama": "Hızlı eğitim + platform",
        "ornek": "1 Dakikada HasatLink'te ilan vermeyi öğren!",
    },
    {
        "format": "Siralama",
        "template": "Turkiye'nin en cok {urun} ureten 5 ili — HasatLink'te hepsini bul",
        "aciklama": "Sıralama + HasatLink'te bul CTA",
        "ornek": "En çok domates üreten 5 il — hepsini HasatLink'te bul",
    },
    {
        "format": "Basari Hikayesi",
        "template": "HasatLink'te basari hikayesi: {hikaye}",
        "aciklama": "Gerçek çiftçi başarı hikayesi",
        "ornek": "Mehmet amca HasatLink'te 3 ayda 50 ton sattı",
    },
    {
        "format": "Challenge",
        "template": "{konu} Challenge! HasatLink'te sen de dene",
        "aciklama": "Challenge + HasatLink katılım CTA",
        "ornek": "HasatLink Challenge: İlk ilanını ver, ilk satışını yap!",
    },
    {
        "format": "Ciftcinin Gunu",
        "template": "Bir ciftcinin gunu: {konu} — HasatLink ile dijital tarim",
        "aciklama": "Day in the Life + dijital tarım mesajı",
        "ornek": "Sabah tarlada, öğlen HasatLink'te satış, akşam teslimat",
    },
    {
        "format": "Beklenti vs Gercek",
        "template": "Beklenti vs Gercek: {konu} — HasatLink gercegi",
        "aciklama": "Komik karşılaştırma + HasatLink gerçeği",
        "ornek": "Beklenti: Aracı iyi fiyat verir / Gerçek: HasatLink'te 2 kat fazla",
    },
    {
        "format": "Tepki",
        "template": "Araci komisyonuna tepki: {konu} — cozum hasatlink.com",
        "aciklama": "Aracı komisyonu tepkisi + HasatLink direkt buluşma",
        "ornek": "Aracı %40 komisyon alıyor! HasatLink'te üretici-alıcı direkt buluşuyor",
    },
    {
        "format": "Hack",
        "template": "Ciftci hack'i: {konu} — hasatlink.com",
        "aciklama": "Pratik ipucu + HasatLink",
        "ornek": "Ciftci hack: HasatLink nakliye eslestirme ile bos kapasiteyi degerlendir",
    },
    {
        "format": "Tarladan Sofraya",
        "template": "Tarladan sofraya: {konu} — HasatLink ile araciyi kaldir",
        "aciklama": "Üretici ile alıcı direkt buluşması + nakliye eşleştirme",
        "ornek": "Tarladan markete aracısız: HasatLink'te ilan ver, alıcı bulsun, nakliye eşleşsin",
    },
    {
        "format": "Araci vs Direkt",
        "template": "Araciyla mi direkt mi? {konu} — HasatLink'te komisyonsuz bulus",
        "aciklama": "Aracılı ticaret vs HasatLink direkt buluşma karşılaştırması",
        "ornek": "Aracı: %30-40 komisyon / HasatLink: Üretici-alıcı direkt, komisyonsuz",
    },
    {
        "format": "Nasil Yapilir",
        "template": "HasatLink'te {konu} nasil yapilir? 3 adimda!",
        "aciklama": "Platform kullanım rehberi",
        "ornek": "HasatLink'te ilan vermek 3 adım: Fotoğraf çek, fiyat yaz, yayınla!",
    },
]


# ============================================================
# ANA FONKSİYONLAR
# ============================================================
def fetch_all_trends() -> dict:
    """
    Tüm kaynaklardan trendleri çek (cache'li).

    Returns:
        {"google": [...], "tiktok": [...], "twitter": [...],
         "youtube": [...], "cached_at": "..."}
    """
    # Cache kontrol
    cached = _load_cache()
    if cached:
        total = sum(len(cached.get(k, [])) for k in ["google", "tiktok", "twitter", "youtube"])
        logger.info(f"Trend cache'ten yüklendi ({total} trend, {cached['cached_at']})")
        return cached

    logger.info("Güncel trendler çekiliyor...")

    data = {
        "google": _fetch_google_trends(),
        "tiktok": _fetch_tiktok_trends(),
        "twitter": _fetch_twitter_trends(),
        "youtube": _fetch_youtube_trends(),
    }

    total = sum(len(v) for v in data.values())
    logger.info(f"Toplam {total} trend bulundu")

    _save_cache(data)
    return data


def get_trending_keywords() -> list[str]:
    """Tüm kaynaklardan düz keyword listesi döndür."""
    data = fetch_all_trends()
    keywords = []
    for source in ["google", "tiktok", "twitter", "youtube"]:
        for item in data.get(source, []):
            kw = item.get("keyword", "").strip()
            if kw and len(kw) > 2:
                keywords.append(kw)
    return keywords


def pick_random_format() -> dict:
    """Evergreen video formatlarından rastgele birini seç."""
    return random.choice(EVERGREEN_FORMATS)


# ============================================================
# TARIM + TREND BİRLEŞTİRİCİ
# ============================================================

# Tarımla ilişkilendirilebilecek trend anahtar kelimeleri
TARIM_BRIDGE_KEYWORDS = {
    # Ekonomi/fiyat → HasatLink komisyonsuz buluşma
    "enflasyon": "Enflasyonda araciya komisyon verme! HasatLink'te uretici-alici direkt bulusuyor",
    "zam": "Zamlar aracidan! HasatLink'te ciftci ile market direkt bulusuyor, komisyonsuz",
    "fiyat": "Fiyat neden 5 kat? Aradaki aracilar yuzunden. HasatLink'te direkt bulus, ilan ver",
    "dolar": "Dolar yukseldi — HasatLink'te ihracatciyla direkt baglan, araciya pay verme",
    "ekonomi": "Ciftcinin dijital pazaryeri HasatLink — araciyi kaldir, komisyonsuz bulus",
    "ihracat": "HasatLink'te ihracatciyla direkt bulusma — ilan ver, alici seni bulsun",
    "maaş": "Ciftci neden az kazaniyor? Aracilar yuzunden. HasatLink ile direkt aliciya ulas",

    # Hava durumu → HasatLink bilgi
    "yağmur": "Yagmur uyarisi! HasatLink'te canli hal fiyatlarini takip et, dogru zamanda sat",
    "sıcak": "Sicak dalgasi urunleri vurdu — HasatLink'te fiyat alarmi kur, piyasayi takip et",
    "don": "Don uyarisi! HasatLink'te ilan ver, hasattan once aliciyi bul",
    "sel": "Sel sonrasi ciftci HasatLink'te nakliye eslestirme ile lojistik buluyor",
    "kuraklık": "Kuraklikta HasatLink nakliye eslestirme ile bos donusu degerlendirin",
    "deprem": "Deprem bolgesi ciftcilerine HasatLink'te ucretsiz ilan imkani",

    # Gida/saglik → HasatLink uretici-alici bulusma
    "organik": "Organik ureten ciftciyi HasatLink'te bul — ilan sahibiyle direkt konuş",
    "sağlık": "Ureticiyi tani, urunun nereden geldigini bil — HasatLink'te direkt bulus",
    "diyet": "Taze organik urun ariyorsan HasatLink'te ureticiyle direkt iletisime gec",
    "vegan": "Vegan urunler ureten ciftciler HasatLink'te ilan veriyor — direkt ulas",
    "gıda": "Gida guvenligi: HasatLink'te ureticiyi tani, ilan sahibiyle konuş",
    "market": "Market sahipleri! HasatLink'te ureticiyi bul, araciyi kaldir, direkt tedarik et",
    "pahalılık": "Neden pahali? Aradaki aracilar yuzunden. HasatLink'te uretici-alici direkt bulusuyor",

    # Teknoloji → HasatLink inovasyon
    "yapay zeka": "HasatLink'te AI ile bitki hastaligi teshisi — fotograf cek, hastalik ogren",
    "drone": "Drone + HasatLink: Akilli tarim ekosistemi hasatlink.com'da",
    "teknoloji": "Ciftcinin dijital pazaryeri HasatLink — canli fiyat, AI teshis, nakliye eslestirme",
    "robot": "Tarimda dijital devrim — HasatLink ile ilan ver, alici seni bulsun",

    # Sosyal/gundem → HasatLink topluluk
    "köy": "Koye donus yapanlar HasatLink'te ilan veriyor — urununu aliciya tanit",
    "göç": "Tersine goc: HasatLink ile koyden direkt aliciya ulas, araciyi kaldir",
    "emekli": "Emekli ciftciler HasatLink'te — ilan ver, tecrubeni degerlendir",
    "mezuniyet": "Ziraat mezunlari: HasatLink'te ilan verin, uretici-alici koprusu olun",
    "bayram": "Bayramda taze urun? HasatLink'te ureticilerin ilanlarina bak, direkt iletisime gec",
    "yaz": "Yaz sezonunda HasatLink'te ilan ver — mevsim urunlerinin alicisini bul",
    "kış": "Kislik tedarik HasatLink'te — ureticiyi bul, nakliye eslestirimesiyle teslim al",
    "ramazan": "Ramazan oncesi HasatLink'te ureticiden direkt tedarik — ilan ver, alici bul",
    "anneler günü": "Koy annelerinin emegi HasatLink'te — dogal urunlerini ilana koy, aliciya ulas",
}


def match_trend_to_agriculture(trends: list[str]) -> list[dict]:
    """
    Güncel trendlerden tarımla ilişkilendirilebilecekleri bul.

    Returns:
        [{"trend": "enflasyon", "konu": "Enflasyon çiftçiyi nasıl etkiliyor?",
          "match_type": "keyword"}, ...]
    """
    matches = []

    for trend in trends:
        trend_lower = trend.lower().replace("#", "")

        # 1) Direkt keyword eşleşmesi
        for keyword, konu in TARIM_BRIDGE_KEYWORDS.items():
            if keyword in trend_lower:
                matches.append({
                    "trend": trend,
                    "konu": konu,
                    "match_type": "keyword_bridge",
                    "bridge_keyword": keyword,
                })
                break

        # 2) Tarım ürünü adı geçiyorsa direkt kullan
        tarim_urunleri = [
            "domates", "biber", "patlıcan", "salatalık", "patates", "soğan",
            "buğday", "arpa", "mısır", "çeltik", "pirinç",
            "elma", "portakal", "üzüm", "kiraz", "kayısı", "şeftali",
            "çay", "fındık", "fıstık", "zeytin", "incir", "nar",
            "pamuk", "ayçiçeği", "karpuz", "kavun", "çilek",
            "bal", "süt", "et", "tavuk", "yumurta",
            "sera", "tarla", "bahçe", "hasat", "ekim", "çiftçi",
            "tarım", "köylü", "traktör", "gübre",
        ]
        for urun in tarim_urunleri:
            if urun in trend_lower:
                matches.append({
                    "trend": trend,
                    "konu": f"Gundemde {trend}: Tarim perspektifinden bakis",
                    "match_type": "direct_product",
                    "product": urun,
                })
                break

    return matches


def generate_trend_fused_topic(takvim_konu: str) -> dict:
    """
    Tarım takvimi konusunu trend formatıyla birleştir.

    Örnek:
        Input:  "Antalya'da domates hasadı başladı"
        Output: {
            "konu": "POV: Antalya'da sabah 5'te domates hasadına çıkıyorsun 🍅",
            "format": "POV",
            "trend_keyword": "#domates",
            "pure_agriculture": "Antalya'da domates hasadı başladı"
        }
    """
    # 1) Trendlerden tarımla eşleşenleri bul
    trending_keywords = get_trending_keywords()
    trend_matches = match_trend_to_agriculture(trending_keywords)

    # 2) Rastgele evergreen format seç
    video_format = pick_random_format()

    # 3) Birleştir
    result = {
        "pure_agriculture": takvim_konu,
        "format": video_format["format"],
        "format_template": video_format["template"],
        "trend_keyword": None,
        "trend_match": None,
    }

    # Trend eşleşmesi varsa onu kullan
    if trend_matches and random.random() < 0.6:  # %60 ihtimal trend kullan
        match = random.choice(trend_matches)
        result["trend_keyword"] = match["trend"]
        result["trend_match"] = match["konu"]

        # Trend + tarım + format birleştir
        result["konu"] = (
            f"[TREND: {match['trend']}] {video_format['format']} formatında — "
            f"{match['konu']} + {takvim_konu}"
        )
    else:
        # Sadece format + tarım konusu
        format_text = video_format["template"].replace("{konu}", takvim_konu)
        for placeholder in ["{bilgi}", "{hikaye}", "{soru}", "{cevap}", "{meslek}", "{urun}"]:
            if placeholder in format_text:
                format_text = format_text.replace(placeholder, takvim_konu)
        result["konu"] = format_text

    return result


# CLI test
if __name__ == "__main__":
    print(f"\n{'='*60}")
    print("TREND TAKİP — TEST")
    print(f"{'='*60}\n")

    # 1) Trendleri çek
    print("[1] Trendler çekiliyor...")
    trends = fetch_all_trends()
    for source in ["google", "tiktok", "twitter", "youtube"]:
        items = trends.get(source, [])
        print(f"  {source:10s}: {len(items)} trend")
        for item in items[:3]:
            print(f"    - {item['keyword']}")

    # 2) Tarım eşleştirmesi
    print(f"\n[2] Tarımla eşleşen trendler:")
    all_keywords = get_trending_keywords()
    matches = match_trend_to_agriculture(all_keywords)
    for m in matches[:5]:
        print(f"  {m['trend']:30s} → {m['konu']}")

    # 3) Format birleştirme
    print(f"\n[3] Trend + Tarım + Format birleştirme:")
    test_konular = [
        "Antalya'da domates hasadı başladı",
        "Trabzon'da fındık bakım zamanı",
        "Malatya kayısısı çiçek açtı",
    ]
    for konu in test_konular:
        fused = generate_trend_fused_topic(konu)
        print(f"\n  Tarım: {fused['pure_agriculture']}")
        print(f"  Format: {fused['format']}")
        if fused["trend_keyword"]:
            print(f"  Trend:  {fused['trend_keyword']}")
        print(f"  → SONUÇ: {fused['konu']}")
