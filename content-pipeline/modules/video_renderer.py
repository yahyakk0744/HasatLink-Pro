"""
Video render modülü — Profesyonel 9:16 Reels/Shorts üretimi
Ken Burns arka plan + animasyonlu altyazı + smooth CTA + marka katmanı
"""
import logging
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from moviepy import (
    VideoClip, ImageClip, AudioFileClip, TextClip, CompositeVideoClip
)
from config.settings import (
    VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, VIDEO_DIR,
    BRAND_NAME, BRAND_COLOR_GREEN,
    MAX_VIDEO_DURATION_SEC, FONT_BOLD, FONT_REGULAR
)

logger = logging.getLogger("hasatlink-pipeline")

W, H = VIDEO_WIDTH, VIDEO_HEIGHT
CTA_DURATION = 4.5   # CTA'nın ekranda kalma süresi (sn)
BRAND_GREEN  = (45, 106, 79)
LIVE_GREEN   = (80, 220, 100)


# ─────────────────────────────────────────────
# Ken Burns efekti
# ─────────────────────────────────────────────

def _make_kenburns_clip(image_path: Path, duration: float, zoom: float = 0.05) -> VideoClip:
    """
    Arka plan görselini yavaşça zoom-in yapar (Ken Burns).
    PIL tabanlı, OpenCV gerektirmez.
    """
    base = np.array(
        Image.open(str(image_path)).convert("RGB").resize((W, H), Image.LANCZOS)
    )

    def make_frame(t: float) -> np.ndarray:
        scale = 1.0 + zoom * (t / duration)
        nh, nw = int(H / scale), int(W / scale)
        y0, x0 = (H - nh) // 2, (W - nw) // 2
        cropped = base[y0: y0 + nh, x0: x0 + nw]
        return np.array(Image.fromarray(cropped).resize((W, H), Image.BILINEAR))

    return VideoClip(make_frame, duration=duration)


# ─────────────────────────────────────────────
# Marka / gradient overlay
# ─────────────────────────────────────────────

def _create_overlay() -> np.ndarray:
    """
    Profesyonel RGBA overlay:
    • Üstte koyu yeşil gradient (marka alanı)
    • Altta siyah gradient (altyazı + CTA okunabilirliği)
    • 5px yeşil aksan çizgisi (üst kenar)
    • HasatLink logosu + URL + CANLI noktası
    """
    img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Üst koyu yeşil gradient
    for y in range(230):
        t = y / 230
        alpha = int(210 * (1 - t) ** 1.3)
        draw.line([(0, y), (W, y)], fill=(8, 22, 12, alpha))

    # Üst aksan çizgisi (HasatLink yeşili)
    draw.rectangle([0, 0, W, 5], fill=(*BRAND_GREEN, 255))

    # Alt siyah gradient (altyazı + CTA için)
    for y in range(H - 640, H):
        t = (y - (H - 640)) / 640
        alpha = int(252 * t ** 0.65)
        draw.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))

    # — Marka fontları —
    try:
        font_brand = ImageFont.truetype(FONT_BOLD,    40)
        font_url   = ImageFont.truetype(FONT_REGULAR, 25)
        font_live  = ImageFont.truetype(FONT_BOLD,    17)
    except OSError:
        font_brand = font_url = font_live = ImageFont.load_default()

    # "HasatLink" beyaz metin
    draw.text((46, 26), BRAND_NAME, fill=(255, 255, 255, 255), font=font_brand)
    # "hasatlink.com" parlak yeşil
    draw.text((46, 72), "hasatlink.com", fill=(*LIVE_GREEN, 240), font=font_url)

    # CANLI göstergesi (sağ üst)
    dot_x, dot_y = W - 66, 36
    draw.ellipse([dot_x, dot_y, dot_x + 30, dot_y + 30], fill=(*LIVE_GREEN, 230))
    draw.text((dot_x - 52, dot_y + 34), "CANLI", fill=(*LIVE_GREEN, 200), font=font_live)

    return np.array(img)


# ─────────────────────────────────────────────
# Yardımcılar
# ─────────────────────────────────────────────

def _calculate_subtitle_timings(lines: list[str], duration: float) -> list[dict]:
    """Altyazı satırlarını CTA öncesine kadar eşit dağıt."""
    if not lines:
        return []
    usable_start = 1.0
    usable_end   = max(duration - CTA_DURATION - 0.6, usable_start + 1.0)
    per_line     = (usable_end - usable_start) / len(lines)
    return [
        {
            "text":  line,
            "start": usable_start + i * per_line,
            "end":   usable_start + (i + 1) * per_line,
        }
        for i, line in enumerate(lines)
    ]


def _text(text: str, size: int, color: str | tuple, w: int,
          stroke_w: int = 0, stroke_color: str = "black",
          bg_color: str | None = None, margin: tuple | None = None) -> TextClip:
    """TextClip oluştur; font bulunamazsa FONT_REGULAR ile fallback."""
    kw = dict(
        text=text, font_size=size, color=color,
        font=FONT_BOLD, size=(w, None),
        method="caption", text_align="center",
    )
    if stroke_w:
        kw["stroke_color"] = stroke_color
        kw["stroke_width"] = stroke_w
    if bg_color is not None:
        kw["bg_color"] = bg_color
    if margin is not None:
        kw["margin"] = margin
    try:
        return TextClip(**kw)
    except Exception:
        kw["font"] = FONT_REGULAR
        kw.pop("stroke_color", None)
        kw.pop("stroke_width", None)
        return TextClip(**kw)


def _fade(clip, fade_in: float = 0.3, fade_out: float = 0.25):
    """CrossFadeIn/Out uygula; desteklenmiyorsa olduğu gibi döndür."""
    try:
        from moviepy.video.fx import CrossFadeIn, CrossFadeOut
        return clip.with_effects([CrossFadeIn(fade_in), CrossFadeOut(fade_out)])
    except Exception:
        return clip


# ─────────────────────────────────────────────
# Ana render fonksiyonu
# ─────────────────────────────────────────────

def render_video(
    image_path: Path,
    audio_path: Path,
    subtitle_lines: list[str],
    title: str,
    output_filename: str = "output.mp4",
) -> Path:
    """
    Profesyonel 9:16 video render.

    Args:
        image_path:      Arka plan görseli (1080×1920 veya yakını)
        audio_path:      TTS seslendirme (.mp3)
        subtitle_lines:  Ekranda gösterilecek satırlar
        title:           Video başlığı (ilk 4 sn)
        output_filename: Çıktı dosya adı

    Returns:
        Path: Üretilen .mp4 dosyası
    """
    output_path = VIDEO_DIR / output_filename
    logger.info(f"Render basliyor: {output_filename}")

    # ── Ses süresi (hard cap: 30 sn) ──
    audio = AudioFileClip(str(audio_path))
    duration = min(audio.duration + 1.5, float(MAX_VIDEO_DURATION_SEC))
    logger.info(f"  Video süresi: {duration:.1f} sn")

    clips = []

    # ── 1. Ken Burns arka plan ──
    clips.append(_make_kenburns_clip(image_path, duration))

    # ── 2. Gradient + marka overlay ──
    clips.append(ImageClip(_create_overlay()).with_duration(duration))

    # ── 3. Başlık (ilk ~4 sn, fade in/out) ──
    title_dur = min(3.8, duration - 1.0)
    title_clip = (
        _text(title, 50, "white", W - 130, stroke_w=2, stroke_color="#0a1a0a")
        .with_position(("center", 152))
        .with_start(0.3)
        .with_duration(title_dur)
    )
    clips.append(_fade(title_clip, 0.5, 0.4))

    # ── 4. Animasyonlu altyazılar ──
    for timing in _calculate_subtitle_timings(subtitle_lines, duration):
        line_dur = timing["end"] - timing["start"]
        sub = (
            _text(timing["text"], 58, "white", W - 110, stroke_w=3, stroke_color="#081208")
            .with_position(("center", H - 430))
            .with_start(timing["start"])
            .with_duration(line_dur)
        )
        clips.append(_fade(sub, min(0.22, line_dur / 4), min(0.18, line_dur / 4)))

    # ── 5. CTA (son 4.5 sn) ──
    cta_start = max(0.0, duration - CTA_DURATION)
    cta_messages = [
        "Ücretsiz ilan ver, alıcı seni bulsun!",
        "Aracıyı kaldır, direkt buluş!",
        "Üretici-alıcı komisyonsuz buluşuyor!",
        "Çiftçi ile market direkt buluşuyor!",
        "Aracısız üreticiden direkt tedarik et!",
        "İlan ver, tedarikçini bul!",
    ]

    cta_msg = (
        _text(random.choice(cta_messages), 39, "white", W - 170, stroke_w=2)
        .with_position(("center", H - 305))
        .with_start(cta_start)
        .with_duration(CTA_DURATION)
    )
    cta_url = (
        _text("hasatlink.com", 56, BRAND_COLOR_GREEN, W - 190,
              bg_color="white", margin=(22, 14))
        .with_position(("center", H - 215))
        .with_start(cta_start + 0.35)
        .with_duration(CTA_DURATION - 0.35)
    )

    clips.append(_fade(cta_msg, 0.4, 0.0))
    clips.append(_fade(cta_url, 0.55, 0.0))

    # ── 6. Render ──
    final = CompositeVideoClip(clips, size=(W, H)).with_audio(audio)
    final.write_videofile(
        str(output_path),
        fps=VIDEO_FPS,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        bitrate="4500k",
        threads=4,
        logger="bar",
    )

    audio.close()
    final.close()

    size_mb = output_path.stat().st_size / (1024 * 1024)
    logger.info(f"Video hazır: {output_path} ({size_mb:.1f} MB)")
    return output_path
