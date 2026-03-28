# HasatLink Content Pipeline - Kurulum Rehberi

## Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                    n8n (Orkestratör)                         │
│  Schedule (08:00) → Pipeline Çalıştır → Hata? → Bildirim   │
│                         ↓ Başarılı                          │
│            Meta Oku → FB + IG + TikTok (paralel)           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Python Pipeline (main.py)                      │
│                                                             │
│  Aşama 1: Senaryo        Aşama 2: Görsel                  │
│  ┌──────────┐            ┌────────────────┐                │
│  │ Gemini   │──HATA──→   │ Pollinations   │──HATA──→       │
│  │ (Ana)    │            │ (Ana, key yok) │                │
│  └──────────┘            └────────────────┘                │
│       ↓ HATA                   ↓ HATA                      │
│  ┌──────────┐            ┌────────────────┐                │
│  │ Groq     │            │ HuggingFace    │                │
│  │ (Yedek)  │            │ (Yedek)        │                │
│  └──────────┘            └────────────────┘                │
│                                                             │
│  Aşama 3: TTS            Aşama 4: Video                   │
│  ┌──────────┐            ┌────────────────┐                │
│  │ Google   │──HATA──→   │ MoviePy        │                │
│  │ Cloud    │            │ (Lokal, %100)  │                │
│  └──────────┘            │ 9:16 MP4       │                │
│       ↓ HATA             └────────────────┘                │
│  ┌──────────┐                                              │
│  │ElevenLabs│──HATA──→                                     │
│  └──────────┘                                              │
│       ↓ HATA                                               │
│  ┌──────────┐                                              │
│  │ Edge TTS │ ← Son yedek, ASLA başarısız olmaz            │
│  │(Limitsiz)│                                              │
│  └──────────┘                                              │
└─────────────────────────────────────────────────────────────┘
```

## 1. Python Kurulumu

```bash
cd C:\Users\Mega\Desktop\HasatLink-Pro\content-pipeline

# Sanal ortam
python -m venv venv
venv\Scripts\activate

# Bağımlılıklar
pip install -r requirements.txt

# FFmpeg (MoviePy için gerekli)
# Zaten kuruluysa atla, yoksa:
# winget install FFmpeg
# veya https://ffmpeg.org/download.html → PATH'e ekle

# TikTok upload için (opsiyonel)
pip install playwright
playwright install chromium
```

## 2. API Anahtarları

```bash
cp .env.example .env
# .env dosyasını düzenle:
```

### Ücretsiz API'leri nereden alırsın:

| API | URL | Ücretsiz Limit |
|-----|-----|----------------|
| **Gemini** | https://aistudio.google.com/apikey | 60 istek/dk, 1500/gün |
| **Groq** | https://console.groq.com/keys | 30 istek/dk, 14.4K token/dk |
| **Pollinations** | Yok (key gerektirmez) | Limitsiz |
| **HuggingFace** | https://huggingface.co/settings/tokens | ~1000 istek/gün |
| **Google Cloud TTS** | https://console.cloud.google.com | 1M karakter/ay |
| **ElevenLabs** | https://elevenlabs.io | 10K karakter/ay |
| **Edge TTS** | Yok (key gerektirmez) | Limitsiz |

## 3. Test Çalıştırma

```bash
# Belirli konuyla test
python main.py --konu "Domates fiyatları bu hafta yükseldi"

# Rastgele konu
python main.py

# Belirli kategori
python main.py --kategori tarim_ipucu
```

Çıktı: `output/videos/hasatlink_YYYYMMDD_HHMMSS.mp4`

## 4. n8n Kurulumu

```bash
# n8n'i lokal kur (Node.js gerekli)
npm install -g n8n

# Başlat
n8n start
# → http://localhost:5678
```

### Workflow import:
1. n8n'i aç → Settings → Import Workflow
2. `n8n/hasatlink-content-workflow.json` dosyasını import et
3. Credentials ayarla:
   - Facebook: Page Access Token
   - Instagram: Graph API Access Token
   - Telegram (hata bildirimi): Bot Token + Chat ID

### n8n Fallback Mantığı (Node Açıklaması):

```
Schedule Trigger (08:00)
    ↓
Execute Command (python main.py)
    ↓
┌── IF: stderr boş değil? ──→ Telegram Hata Bildirimi
│
└── Başarılı ──→ Code: Meta JSON Oku
                    ↓
                Code: Video Binary Hazırla
                    ↓
            ┌───────┼───────┐
            ↓       ↓       ↓
         Facebook  IG     TikTok
         (HTTP)   (HTTP)  (Playwright)
```

Python tarafındaki fallback (Gemini→Groq, Pollinations→HF, Google TTS→ElevenLabs→Edge TTS)
otomatik çalışır, n8n sadece sonucu alır.

## 5. Teknik Dikkat Noktaları

### Çözünürlük
- Video: 1080x1920 (9:16) — tüm platformlar için ideal
- Görsel: Aynı çözünürlükte üretiliyor
- Bitrate: 4000 kbps — Instagram max 3500, biraz üstü → platform sıkıştırır

### Bekleme Süreleri
- Pollinations.ai: Görsel üretimi 10-60 sn sürebilir (timeout: 120s)
- HuggingFace: Model soğuksa 503 döner, 30-60 sn yükleme süresi
- Google TTS: <2 sn (çok hızlı)
- Video render: 30 sn video → ~20-40 sn render (CPU'ya bağlı)

### Rate Limiting
- Gemini: 60/dk → günde 1 video için sorun yok
- Groq: 30/dk → yedek olarak yeterli
- Pipeline günde 1 kez çalışıyor, limit sorunun olmayacak

### Dosya Boyutu
- Instagram Reels max: 4 GB (bizimki ~15-30 MB)
- TikTok max: 287.6 MB
- Facebook: 10 GB

### Tarım Görselleri İçin Prompt İpuçları
Pollinations/HF'ye gönderilen prompt'a otomatik eklenen:
- "professional agricultural photography"
- "warm natural lighting, Turkish farmland"
- "vertical composition 9:16"
Bu sayede tarım temalı, dikey, profesyonel görseller üretilir.
