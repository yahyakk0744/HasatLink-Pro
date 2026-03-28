"""
HasatLink Content Pipeline - Konfigürasyon
Tüm API anahtarları .env dosyasından okunur.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Dizinler ---
BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "output"
VIDEO_DIR = OUTPUT_DIR / "videos"
IMAGE_DIR = OUTPUT_DIR / "images"
AUDIO_DIR = OUTPUT_DIR / "audio"
TEMPLATE_DIR = BASE_DIR / "templates"

# --- API Anahtarları ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
GOOGLE_CLOUD_TTS_KEY = os.getenv("GOOGLE_CLOUD_TTS_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# --- Video Ayarları (9:16 Reels/Shorts) ---
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920
VIDEO_FPS = 30
VIDEO_DURATION_SEC = 30      # Varsayılan video süresi (ses süresine göre ayarlanır)
MAX_VIDEO_DURATION_SEC = 30  # Hard cap: Instagram/TikTok Reels maks süre

# --- Marka ---
BRAND_NAME = "HasatLink"
BRAND_COLOR_GREEN = "#2D6A4F"
BRAND_COLOR_ORANGE = "#A47148"
BRAND_COLOR_BG = "#FAFAF8"

# Font yolları (MoviePy 2.x Pillow backend için dosya yolu gerekli)
import platform
if platform.system() == "Windows":
    FONT_BOLD    = "C:/Windows/Fonts/arialbd.ttf"
    FONT_REGULAR = "C:/Windows/Fonts/arial.ttf"
else:
    # Linux/Mac fallback
    FONT_BOLD    = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# Yedek: dosya yoksa string kullan (MoviePy ImageMagick backend)
import os as _os
if not _os.path.exists(FONT_BOLD):
    FONT_BOLD    = "Arial-Bold"
    FONT_REGULAR = "Arial"

# --- Tarım İçerik Kategorileri ---
CONTENT_CATEGORIES = [
    "gunluk_fiyat",       # Günlük hal fiyatları infografiği
    "tarim_ipucu",        # Mevsimsel tarım ipuçları
    "urun_tanitim",       # HasatLink özellik tanıtımı
    "basari_hikayesi",    # Çiftçi başarı hikayeleri
    "hava_uyari",         # Hava durumu ve don uyarıları
    "pazar_analiz",       # Piyasa trend analizi
]

# --- Fallback Retry Ayarları ---
MAX_RETRIES = 2
RETRY_DELAY_SEC = 3
