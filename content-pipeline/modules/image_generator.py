"""
Aşama 2: Görsel/Arka Plan Üretimi (9:16 dikey)
Ana:  Yerel A1111 WebUI API (http://127.0.0.1:7860)
2.    HuggingFace Inference API (SDXL)
Yedek: Profesyonel Pillow tarım şablonu
"""
import logging
import random
import math
import requests
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from config.settings import (
    HUGGINGFACE_API_KEY, IMAGE_DIR,
    VIDEO_WIDTH, VIDEO_HEIGHT, FONT_BOLD, FONT_REGULAR
)

logger = logging.getLogger("hasatlink-pipeline")
W, H = VIDEO_WIDTH, VIDEO_HEIGHT


# ─────────────────────────────────────────────
# Yerel Diffusers (Realistic Vision safetensors)
# ─────────────────────────────────────────────

MODEL_PATH = "C:/sd-webui/models/Stable-diffusion/realisticVision.safetensors"
_sd_pipe = None  # Singleton — bir kez yükle, hep kullan

def _get_sd_pipe():
    """Pipeline'ı ilk çağrıda yükle, sonra cache'den döndür."""
    global _sd_pipe
    if _sd_pipe is not None:
        return _sd_pipe

    import torch
    from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler

    if not Path(MODEL_PATH).exists():
        raise FileNotFoundError(f"Model bulunamadi: {MODEL_PATH}")

    logger.info("SD modeli yukleniyor (ilk seferinde yavas)...")
    pipe = StableDiffusionPipeline.from_single_file(
        MODEL_PATH,
        torch_dtype=torch.float16,
        use_safetensors=True,
    )
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config, use_karras_sigmas=True
    )
    pipe.enable_attention_slicing()   # 4GB VRAM icin
    pipe.to("cuda")
    _sd_pipe = pipe
    logger.info("SD modeli hazir (GPU'da)")
    return pipe


def _generate_with_diffusers(prompt: str, output_path: Path) -> Path:
    """Yerel Realistic Vision modeli ile gorsel uret (diffusers)."""
    import torch

    pipe = _get_sd_pipe()

    neg = (
        "blurry, low quality, cartoon, anime, watermark, text, logo, "
        "deformed, ugly, bad anatomy, oversaturated, unrealistic"
    )

    with torch.autocast("cuda"):
        result = pipe(
            prompt=prompt + ", professional photography, sharp focus, high detail",
            negative_prompt=neg,
            width=512,
            height=912,     # 9:16 oranı
            num_inference_steps=28,
            guidance_scale=7.0,
        )

    img = result.images[0].convert("RGB")
    img = img.resize((W, H), Image.LANCZOS)
    img.save(str(output_path), quality=95)

    size_kb = output_path.stat().st_size // 1024
    logger.info(f"Diffusers gorsel uretildi: {output_path.name} ({size_kb} KB)")
    return output_path


# ─────────────────────────────────────────────
# HuggingFace (SDXL)
# ─────────────────────────────────────────────

def _generate_with_huggingface(prompt: str, output_path: Path) -> Path:
    """HuggingFace Inference API — SDXL ile görsel üret."""
    if not HUGGINGFACE_API_KEY:
        raise ValueError("HUGGINGFACE_API_KEY eksik")

    url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "width":  W,
            "height": H,
            "num_inference_steps": 30,
            "guidance_scale": 7.5,
        }
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=180)
    if resp.status_code == 503:
        raise RuntimeError("HF model yükleniyor, retry...")
    resp.raise_for_status()

    ct = resp.headers.get("content-type", "")
    if not ct.startswith("image"):
        raise ValueError(f"Beklenmeyen yanıt: {ct}")

    output_path.write_bytes(resp.content)
    logger.info(f"Görsel HF ile üretildi: {output_path.name} ({len(resp.content)//1024} KB)")
    return output_path


# ─────────────────────────────────────────────
# Profesyonel Pillow Fallback
# ─────────────────────────────────────────────

def _draw_leaf(draw: ImageDraw.ImageDraw, cx: int, cy: int,
               size: int, angle: float, color: tuple):
    """Basit yaprak şekli çiz (bezier benzeri polygon)."""
    pts = []
    for i in range(20):
        t = i / 19
        # Elips tabanlı yaprak
        rx = size * 0.4 * math.sin(math.pi * t)
        ry = size * (t - 0.5) * 2
        rad = math.radians(angle)
        x = cx + rx * math.cos(rad) - ry * math.sin(rad)
        y = cy + rx * math.sin(rad) + ry * math.cos(rad)
        pts.append((x, y))
    for i in range(19, -1, -1):
        t = i / 19
        rx = -size * 0.15 * math.sin(math.pi * t)
        ry = size * (t - 0.5) * 2
        rad = math.radians(angle)
        x = cx + rx * math.cos(rad) - ry * math.sin(rad)
        y = cy + rx * math.sin(rad) + ry * math.cos(rad)
        pts.append((x, y))
    if len(pts) >= 3:
        draw.polygon(pts, fill=color)


def _generate_pillow_background(output_path: Path, theme: str = "green") -> Path:
    """
    Profesyonel tarım temalı Pillow arka planı.
    3 katman: gökyüzü gradient + alan + bitki silüetleri
    """
    rng = random.Random(42)

    arr = np.zeros((H, W, 3), dtype=np.uint8)

    if theme == "warm":
        # Altın saat: turuncu/sarı gökyüzü → yeşil tarla
        for y in range(H):
            t = y / H
            if t < 0.45:  # gökyüzü
                s = t / 0.45
                r = int(255 - s * 80)
                g = int(160 - s * 60)
                b = int(60  - s * 30)
            elif t < 0.55:  # ufuk
                s = (t - 0.45) / 0.10
                r = int(175 + s * 20)
                g = int(100 + s * 60)
                b = int(30  + s * 10)
            else:  # tarla
                s = (t - 0.55) / 0.45
                r = int(60  - s * 20)
                g = int(100 + s * 20)
                b = int(30  - s * 10)
            arr[y, :] = np.clip([r, g, b], 0, 255)
    else:
        # Yeşil: sabah yeşili → toprak kahvesi
        for y in range(H):
            t = y / H
            if t < 0.35:  # açık gökyüzü
                s = t / 0.35
                r = int(100 + s * 30)
                g = int(170 + s * 20)
                b = int(130 + s * 10)
            elif t < 0.50:  # yeşil orta
                s = (t - 0.35) / 0.15
                r = int(55  - s * 10)
                g = int(120 - s * 20)
                b = int(50  - s * 15)
            else:  # koyu tarla
                s = (t - 0.50) / 0.50
                r = int(35  + s * 25)
                g = int(70  + s * 10)
                b = int(25  + s * 5)
            arr[y, :] = np.clip([r, g, b], 0, 255)

    img  = Image.fromarray(arr, "RGB")
    draw = ImageDraw.Draw(img, "RGBA")

    # ── Tarla çizgileri (perspektif) ──
    horizon_y = int(H * 0.50)
    for i in range(14):
        t = i / 13
        x_top  = int(W * 0.5 + (t - 0.5) * W * 0.15)
        x_bot  = int(t * W)
        alpha  = rng.randint(18, 38)
        draw.line([(x_top, horizon_y), (x_bot, H)], fill=(0, 0, 0, alpha), width=2)

    # ── Yaprak silüetleri (arka, büyük) ──
    leaf_colors_dark = [
        (20, 65, 25, 90), (15, 80, 30, 80), (30, 55, 20, 70),
        (10, 70, 35, 85), (25, 60, 15, 75),
    ]
    for _ in range(18):
        cx    = rng.randint(-60, W + 60)
        cy    = rng.randint(int(H * 0.3), H + 80)
        size  = rng.randint(140, 340)
        angle = rng.uniform(-30, 30)
        color = rng.choice(leaf_colors_dark)
        _draw_leaf(draw, cx, cy, size, angle, color)

    # ── Yaprak silüetleri (ön, küçük, daha parlak) ──
    leaf_colors_bright = [
        (40, 120, 50, 110), (55, 140, 35, 100), (30, 110, 60, 120),
    ]
    for _ in range(12):
        cx    = rng.randint(-30, W + 30)
        cy    = rng.randint(int(H * 0.55), H + 40)
        size  = rng.randint(80, 180)
        angle = rng.uniform(-15, 15)
        color = rng.choice(leaf_colors_bright)
        _draw_leaf(draw, cx, cy, size, angle, color)

    # ── Güneş ışığı efekti (sol üst köşe) ──
    sun_x, sun_y = int(W * 0.75), int(H * 0.08)
    for radius in range(380, 80, -40):
        alpha = int(8 * (1 - radius / 380))
        draw.ellipse(
            [sun_x - radius, sun_y - radius, sun_x + radius, sun_y + radius],
            fill=(255, 220, 100, alpha)
        )

    # ── HasatLink marka watermark (orta, hafif) ──
    try:
        font_wm = ImageFont.truetype(FONT_BOLD, 68)
    except Exception:
        font_wm = ImageFont.load_default()

    # Yarı saydam beyaz banner (orta)
    bx1, by1 = 70, H // 2 - 90
    bx2, by2 = W - 70, H // 2 + 90
    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=20,
                            fill=(255, 255, 255, 55), outline=(255, 255, 255, 80), width=2)

    # ── Hafif blur için numpy konvolüsyon ──
    # PIL Gaussian blur
    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))

    img.save(str(output_path), quality=95)
    logger.info(f"Pillow arka plan üretildi: {output_path.name}")
    return output_path


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────

def generate_image(prompt: str, filename: str = "background.png") -> Path:
    """
    Arka plan görseli üret:
    1. HuggingFace SDXL (API key varsa)
    2. Profesyonel Pillow tarım şablonu (fallback)

    Args:
        prompt:   İngilizce görsel açıklaması
        filename: Çıktı dosya adı

    Returns:
        Path: Üretilen görsel dosyası
    """
    output_path = IMAGE_DIR / filename
    enhanced = (
        f"{prompt}, professional agricultural photography, "
        f"warm natural lighting, Turkish farmland, vertical portrait 9:16, "
        f"high quality, cinematic, vibrant, shallow depth of field"
    )

    # Deneme 1: Yerel Diffusers (en kaliteli, GPU)
    try:
        return _generate_with_diffusers(enhanced, output_path)
    except Exception as e:
        logger.warning(f"Diffusers basarisiz: {e}")

    # Deneme 2: HuggingFace
    if HUGGINGFACE_API_KEY:
        for attempt in range(2):
            try:
                return _generate_with_huggingface(enhanced, output_path)
            except RuntimeError:
                logger.warning(f"HF model yukleniyor, deneme {attempt+1}/2...")
                import time; time.sleep(8)
            except Exception as e:
                logger.warning(f"HF basarisiz: {e}")
                break

    # Fallback: Pillow
    logger.info("Pillow tarim sablonuna geciliyor...")
    theme = "warm" if any(w in prompt.lower() for w in ["sunset", "golden", "tomato", "wheat"]) else "green"
    return _generate_pillow_background(output_path, theme=theme)
