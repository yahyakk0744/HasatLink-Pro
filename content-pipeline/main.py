"""
HasatLink Content Pipeline - Ana Orkestratör
Günde 1 video üretir: Senaryo → Görsel → Ses → Video → (n8n'e bırak)
Bölgesel tarım takvimine göre her yerin iklimine uygun içerik üretir.

Kullanım:
    python main.py                              # Takvime göre otomatik konu
    python main.py --konu "domates fiyatı"      # Belirli konu
    python main.py --kategori tarim_ipucu       # Belirli kategori
    python main.py --bolge akdeniz              # Belirli bölge
    python main.py --takvim                     # Bugünün tarım gündemini göster
"""
import argparse
import logging
import random
import sys
from datetime import datetime
from pathlib import Path
from config.settings import (
    OUTPUT_DIR, VIDEO_DIR, IMAGE_DIR, AUDIO_DIR, CONTENT_CATEGORIES
)
from modules.script_generator import generate_script
from modules.image_generator import generate_image
from modules.tts_engine import generate_speech
from modules.video_renderer import render_video
from modules.tarim_takvimi import generate_daily_topics, get_current_agenda, get_region_agenda, BOLGESEL_TAKVIM
from modules.trend_tracker import generate_trend_fused_topic, fetch_all_trends, get_trending_keywords, match_trend_to_agriculture

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(OUTPUT_DIR / "pipeline.log", encoding="utf-8"),
    ]
)
logger = logging.getLogger("hasatlink-pipeline")

# Konu havuzu (kategori bazlı)
KONU_HAVUZU = {
    "gunluk_fiyat": [
        "HasatLink'te canlı hal fiyatları takibi — doğru zamanda sat, doğru zamanda al",
        "Haftanın en çok fiyatı artan 3 sebze — HasatLink'te fiyat alarmı kur, haberin olsun",
        "Çilek sezonu açıldı! Üreticiysen HasatLink'te ilanını ver, alıcın seni bulsun",
        "Aracı neden bu kadar komisyon alıyor? HasatLink'te üretici-alıcı direkt buluşuyor",
    ],
    "tarim_ipucu": [
        "Domates fidesi dikerken 3 büyük hata — HasatLink'te tarım ipuçları",
        "Sulama zamanlaması ipuçları — HasatLink'te canlı hava durumu takibi",
        "Sera tarımı başlayacaklara rehber — HasatLink'te sera ürünlerinin ilanını ver",
        "Organik tarıma geçiş rehberi — HasatLink'te organik üreticiler alıcıyla buluşuyor",
        "HasatLink AI ile bitki hastalığını fotoğrafla teşhis et — ücretsiz!",
    ],
    "urun_tanitim": [
        "HasatLink'te ilan vermek 3 adım: Fotoğraf çek, fiyat yaz, yayınla — ücretsiz!",
        "Aracıya komisyon verme! HasatLink'te üretici ile alıcı direkt buluşuyor",
        "HasatLink nakliye eşleştirme: Boş kapasiten mi var? Yük arayanla eşleş!",
        "HasatLink fiyat uyarısı: Takip ettiğin ürün istediğin fiyata düşünce haber al",
        "HasatLink teklif sistemi: Alıcı-satıcı pazarlık yapsın, anlaşsın",
        "HasatLink'te AI ile bitki hastalığı teşhisi — fotoğraf çek, hastalığı öğren",
        "HasatLink'te canlı mesajlaşma: Üretici ile alıcı direkt konuşsun, güven kursun",
        "Market sahibiysen HasatLink'te üreticiyi bul, aracısız tedarik et",
    ],
    "basari_hikayesi": [
        "Aydınlı üretici HasatLink'te ilan verdi, marketten direkt sipariş geldi",
        "Antalya'dan İstanbul'a: HasatLink ile aracısız alıcı buldu",
        "Emekli öğretmen HasatLink'te ilan vererek organik ürünlerini tanıttı",
        "Köyüne dönen genç çiftçi HasatLink ile alıcılarına direkt ulaşıyor",
    ],
    "hava_uyari": [
        "Don uyarısı! HasatLink'te canlı hava takibi ile hasadını planla",
        "Yağmur sezonu başlıyor: HasatLink'te ürününü ilanla, alıcı bulunsun",
        "Sıcak dalgası geliyor — HasatLink'te fiyat alarmı kur, piyasayı takip et",
    ],
    "pazar_analiz": [
        "2026 tarım trendleri: HasatLink ile üretici-alıcı direkt buluşuyor",
        "Organik tarım pazarı büyüyor — HasatLink'te organik üreticiler ilan veriyor",
        "İhracatta öne çıkan 5 ürün — HasatLink'te ihracatçıyla direkt buluş",
        "Türkiye tarım haritası: Hangi il ne üretir? HasatLink'te üreticileri bul",
    ],
}


def run_pipeline(konu: str | None = None, kategori: str | None = None, bolge: str | None = None) -> Path:
    """
    Tam pipeline'ı çalıştır: Metin → Görsel → Ses → Video

    Args:
        konu: Belirli bir konu (opsiyonel)
        kategori: İçerik kategorisi (opsiyonel)
        bolge: Bölge filtresi (opsiyonel, ör. "akdeniz", "karadeniz")

    Returns:
        Path: Üretilen video dosyasının yolu
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 1) Konu belirle — Takvim + Trend + Format birleştir
    trend_info = None
    if not konu:
        # Önce tarım takviminden ham konu al
        ham_konu = None

        if bolge:
            agenda = get_region_agenda(bolge)
            if agenda:
                item = random.choice(agenda)
                il = random.choice(item["iller"])
                ham_konu = f"{il}'da {item['urun'].lower()} — {item['ipucu']}"
                kategori = "takvim_bolgesel"

        if not ham_konu:
            takvim_konulari = generate_daily_topics(adet=5)
            if kategori and kategori in KONU_HAVUZU:
                havuz = KONU_HAVUZU[kategori] + takvim_konulari
                ham_konu = random.choice(havuz)
            elif takvim_konulari and random.random() < 0.7:
                ham_konu = random.choice(takvim_konulari)
                kategori = "takvim_otomatik"
            else:
                kategori = random.choice(list(KONU_HAVUZU.keys()))
                ham_konu = random.choice(KONU_HAVUZU[kategori])

        # Trend + Format ile birleştir
        logger.info("Trendler kontrol ediliyor...")
        trend_info = generate_trend_fused_topic(ham_konu)
        konu = trend_info["konu"]

        logger.info(f"  Ham tarım konusu: {trend_info['pure_agriculture']}")
        logger.info(f"  Video format: {trend_info['format']}")
        if trend_info.get("trend_keyword"):
            logger.info(f"  Trend eşleşmesi: {trend_info['trend_keyword']}")
        logger.info(f"  Final konu: {konu}")

    logger.info(f"{'='*60}")
    logger.info(f"HasatLink Content Pipeline Başlıyor")
    logger.info(f"Konu: {konu}")
    logger.info(f"Zaman: {timestamp}")
    if trend_info:
        logger.info(f"Format: {trend_info['format']}")
        if trend_info.get('trend_keyword'):
            logger.info(f"Trend: {trend_info['trend_keyword']}")
    logger.info(f"{'='*60}")

    # 2) AŞAMA 1: Senaryo üret
    logger.info("AŞAMA 1/4: Senaryo üretiliyor...")
    script = generate_script(konu)
    logger.info(f"  Başlık: {script['baslik']}")
    logger.info(f"  Sahne metni: {len(script['sahne_metni'])} karakter")
    logger.info(f"  Altyazı: {len(script['altyazi_satirlari'])} satır")

    # 3) AŞAMA 2: Arka plan görseli üret
    logger.info("AŞAMA 2/4: Görsel üretiliyor...")
    image_path = generate_image(
        prompt=script["gorsel_prompt"],
        filename=f"bg_{timestamp}.png"
    )

    # 4) AŞAMA 3: Seslendirme
    logger.info("AŞAMA 3/4: Seslendirme üretiliyor...")
    audio_path = generate_speech(
        text=script["sahne_metni"],
        filename=f"narration_{timestamp}.mp3"
    )

    # 5) AŞAMA 4: Video birleştirme
    logger.info("AŞAMA 4/4: Video render ediliyor...")
    video_path = render_video(
        image_path=image_path,
        audio_path=audio_path,
        subtitle_lines=script["altyazi_satirlari"],
        title=script["baslik"],
        output_filename=f"hasatlink_{timestamp}.mp4"
    )

    # 6) Metadata kaydet (n8n bu dosyayı okuyabilir)
    import json
    meta_path = VIDEO_DIR / f"hasatlink_{timestamp}.json"
    meta = {
        "video_file": str(video_path),
        "title": script["baslik"],
        "description": script["aciklama"],
        "hashtags": script["hashtags"],
        "category": kategori,
        "created_at": timestamp,
        "platforms": ["facebook", "instagram", "tiktok"],
    }
    if trend_info:
        meta["trend"] = {
            "format": trend_info["format"],
            "trend_keyword": trend_info.get("trend_keyword"),
            "pure_agriculture": trend_info["pure_agriculture"],
        }
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    logger.info(f"{'='*60}")
    logger.info(f"TAMAMLANDI!")
    logger.info(f"Video: {video_path}")
    logger.info(f"Meta:  {meta_path}")
    logger.info(f"{'='*60}")

    return video_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HasatLink Content Pipeline")
    parser.add_argument("--konu", type=str, help="Video konusu")
    parser.add_argument("--kategori", type=str, choices=CONTENT_CATEGORIES, help="İçerik kategorisi")
    parser.add_argument("--bolge", type=str, choices=list(BOLGESEL_TAKVIM.keys()),
                        help="Bölge filtresi (akdeniz, ege, marmara, ic_anadolu, karadeniz, dogu_anadolu, guneydogu)")
    parser.add_argument("--takvim", action="store_true", help="Bugünün tarım gündemini göster (video üretme)")
    parser.add_argument("--trendler", action="store_true", help="Güncel trendleri ve tarım eşleşmelerini göster")

    args = parser.parse_args()

    if args.trendler:
        # Trendleri göster
        print(f"\n{'='*60}")
        print(f"GUNCEL TRENDLER + TARIM ESLESMESI")
        print(f"{'='*60}\n")

        trends = fetch_all_trends()
        for source in ["google", "tiktok", "twitter", "youtube"]:
            items = trends.get(source, [])
            print(f"  [{source.upper():10s}] {len(items)} trend")
            for item in items[:5]:
                print(f"    - {item['keyword']}")
            if len(items) > 5:
                print(f"    ... +{len(items)-5} daha")
            print()

        # Tarım eşleşmeleri
        all_kw = get_trending_keywords()
        matches = match_trend_to_agriculture(all_kw)
        if matches:
            print(f"{'='*60}")
            print(f"TARIMLA ESLESEN TRENDLER ({len(matches)} adet):")
            print(f"{'='*60}")
            for m in matches:
                print(f"  {m['trend']:30s} -> {m['konu']}")
        else:
            print("  Tarımla direkt eşleşen trend bulunamadı (evergreen formatlar kullanılacak)")

        # Birleştirme örnekleri
        print(f"\n{'='*60}")
        print(f"TREND + TARIM BIRLESTIRME ORNEKLERI:")
        print(f"{'='*60}")
        for t in generate_daily_topics(adet=3):
            fused = generate_trend_fused_topic(t)
            print(f"\n  Tarim:  {fused['pure_agriculture']}")
            print(f"  Format: {fused['format']}")
            if fused.get('trend_keyword'):
                print(f"  Trend:  {fused['trend_keyword']}")
            print(f"  Sonuc:  {fused['konu']}")
        print()

    elif args.takvim:
        # Sadece gündem göster
        print(f"\n{'='*60}")
        print(f"BUGÜNÜN TARIM GÜNDEMİ — {datetime.now().strftime('%d %B %Y')}")
        print(f"{'='*60}\n")

        agenda = get_current_agenda()
        bolge_grp: dict[str, list] = {}
        for item in agenda:
            bolge_grp.setdefault(item["bolge_ad"], []).append(item)

        for bolge_ad, items in bolge_grp.items():
            print(f"  {bolge_ad} ({items[0]['iller'][0]}, {items[0]['iller'][1]}...)")
            for item in items:
                emoji = {"hasat": "🌾", "ekim": "🌱", "dikim": "🌱", "bakım": "🔧",
                         "budama": "✂️", "fide": "🌿", "hazırlık": "📋", "çiçek": "🌸",
                         "gübreleme": "💧", "kurutma": "☀️", "satış": "💰", "üretim": "🏭",
                         "depolama": "📦", "doğum": "🐑", "mera": "🐄"}.get(item["aksiyon"], "📌")
                print(f"    {emoji} {item['urun']:20s} [{item['aksiyon']}]")
                print(f"       {item['ipucu']}")
            print()

        print(f"{'='*60}")
        print("Otomatik Video Konuları:")
        for t in generate_daily_topics(adet=5):
            print(f"  → {t}")
        print()
    else:
        run_pipeline(konu=args.konu, kategori=args.kategori, bolge=args.bolge)
