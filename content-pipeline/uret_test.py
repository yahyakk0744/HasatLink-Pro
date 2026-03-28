"""
HasatLink — Test Video Üretimi
Pollinations.ai (görsel) + Edge TTS (ses) + Profesyonel Renderer

Kullanım:
    python uret_test.py
    python uret_test.py --konu "domates fiyatları"
"""
import argparse
import asyncio
import logging
import sys
import time
from pathlib import Path

import edge_tts
from modules.video_renderer import render_video
from modules.image_generator import generate_image

# ── Logging ──────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("hasatlink-test")

OUT   = Path("C:/Users/Mega/Desktop/HasatLink-Pro/content-pipeline/output")
W, H  = 1080, 1920

# ── Senaryo (hardcoded — API key gerektirmez) ──
SENARYO_VARSAYILAN = {
    "baslik": "Aracılar %40 Komisyon Alıyor!",
    "sahne_metni": (
        "Bunu biliyor muydun? "
        "Bir domates tarladan markete gidene kadar en az üç aracıdan geçiyor. "
        "Çiftçi beş liraya satıyor, markette yirmi beş lira. "
        "Aradaki yirmi lira? Aracıların cebine giriyor. "
        "HasatLink'te üretici ile alıcı direkt buluşuyor. "
        "Aracı yok, komisyon yok. "
        "hasatlink.com'da ücretsiz ilan ver, alıcı seni bulsun."
    ),
    "altyazi_satirlari": [
        "Domates tarladan markete",
        "3 aracıdan geçiyor!",
        "Ciftci 5 TL, markette 25 TL",
        "Fark aracıların cebine",
        "HasatLink'te aracı YOK",
        "Üretici-alıcı direkt buluşuyor",
    ],
    "gorsel_prompt": (
        "Turkish farmer holding fresh red tomatoes in sunlit greenhouse, "
        "warm golden hour light, professional agricultural photography, "
        "shallow depth of field, bokeh green plants background, "
        "4K quality, cinematic, vertical portrait composition"
    ),
}


# ── Görsel üretimi ────────────────────────────

def uret_gorsel(prompt: str, konu_slug: str = "test") -> Path:
    """HF SDXL (API key varsa) veya profesyonel Pillow şablonu."""
    return generate_image(prompt, filename=f"bg_{konu_slug}.png")


# ── Ses üretimi ───────────────────────────────

def uret_ses(metin: str, konu_slug: str = "test") -> Path:
    """
    Edge TTS ile Türkçe seslendirme üret (tr-TR-EmelNeural).
    """
    out_path = OUT / "audio" / f"narration_{konu_slug}.mp3"
    logger.info("Seslendirme üretiliyor (Edge TTS — tr-TR-EmelNeural)...")

    async def _run():
        comm = edge_tts.Communicate(
            metin,
            voice="tr-TR-EmelNeural",
            rate="-8%",       # Hafif yavaş — doğal ve anlaşılır
            volume="+10%",    # Biraz daha yüksek ses
        )
        await comm.save(str(out_path))

    asyncio.run(_run())
    logger.info(f"  Ses hazır: {out_path.name}")
    return out_path


# ── Ana akış ──────────────────────────────────

def main(konu_override: str | None = None):
    t0 = time.time()

    print("=" * 62)
    print("  HASATLINK — TEST VİDEO ÜRETİMİ")
    print("  HF SDXL / Pillow + Edge TTS + Profesyonel Renderer")
    print("=" * 62)

    senaryo = dict(SENARYO_VARSAYILAN)
    konu_slug = "test"

    if konu_override:
        # Manuel konu verilmişse sadece metni değiştir
        senaryo["baslik"]       = konu_override[:60]
        senaryo["sahne_metni"]  = (
            f"{konu_override}. "
            "HasatLink'te üretici ile alıcı aracısız buluşuyor. "
            "hasatlink.com'da ücretsiz ilan ver."
        )
        konu_slug = konu_override[:20].replace(" ", "_").lower()

    gorsel = uret_gorsel(senaryo["gorsel_prompt"], konu_slug)
    ses    = uret_ses(senaryo["sahne_metni"], konu_slug)

    video = render_video(
        image_path=gorsel,
        audio_path=ses,
        subtitle_lines=senaryo["altyazi_satirlari"],
        title=senaryo["baslik"],
        output_filename="hasatlink_test.mp4",
    )

    elapsed = time.time() - t0
    print()
    print("=" * 62)
    print(f"  TAMAMLANDI! ({elapsed:.0f} saniye)")
    print(f"  Video:   {video}")
    print(f"  Görsel:  {gorsel}")
    print(f"  Ses:     {ses}")
    print("=" * 62)
    print(f"\n  Videoyu aç:  {video}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HasatLink Test Video Üretimi")
    parser.add_argument("--konu", type=str, help="Özel video konusu")
    args = parser.parse_args()
    main(konu_override=args.konu)
