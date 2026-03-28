"""
Aşama 3: Seslendirme (Text-to-Speech)
Ana: Google Cloud TTS (ücretsiz tier: 1M karakter/ay)
Yedek: ElevenLabs (ücretsiz tier: 10K karakter/ay)
Son yedek: Edge TTS (tamamen ücretsiz, limitsiz)
"""
import asyncio
import logging
import requests
import base64
from pathlib import Path
from config.settings import (
    GOOGLE_CLOUD_TTS_KEY, ELEVENLABS_API_KEY, AUDIO_DIR
)
from modules.fallback import with_fallback

logger = logging.getLogger("hasatlink-pipeline")


def _generate_with_google_tts(text: str, output_path: Path) -> Path:
    """Google Cloud TTS ile seslendirme."""
    if not GOOGLE_CLOUD_TTS_KEY:
        raise ValueError("GOOGLE_CLOUD_TTS_KEY tanımlı değil")

    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={GOOGLE_CLOUD_TTS_KEY}"
    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": "tr-TR",
            "name": "tr-TR-Wavenet-E",  # Kadın ses, doğal
            "ssmlGender": "FEMALE"
        },
        "audioConfig": {
            "audioEncoding": "MP3",
            "speakingRate": 0.95,  # Biraz yavaş, anlaşılır
            "pitch": 0.0,
        }
    }

    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()

    audio_bytes = base64.b64decode(resp.json()["audioContent"])
    output_path.write_bytes(audio_bytes)
    logger.info(f"Ses kaydedildi (Google TTS): {output_path}")
    return output_path


def _generate_with_elevenlabs(text: str, output_path: Path) -> Path:
    """ElevenLabs ile seslendirme."""
    if not ELEVENLABS_API_KEY:
        raise ValueError("ELEVENLABS_API_KEY tanımlı değil")

    # Rachel sesi (varsayılan, Türkçe desteği var)
    voice_id = "21m00Tcm4TlvDq8ikWAM"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.75,
        }
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()

    output_path.write_bytes(resp.content)
    logger.info(f"Ses kaydedildi (ElevenLabs): {output_path}")
    return output_path


def _generate_with_edge_tts(text: str, output_path: Path) -> Path:
    """Edge TTS ile seslendirme (son yedek, limitsiz)."""
    import edge_tts

    async def _run():
        communicate = edge_tts.Communicate(
            text,
            voice="tr-TR-EmelNeural",  # Sıcak kadın sesi
            rate="-5%",  # Biraz yavaşlat
        )
        await communicate.save(str(output_path))

    asyncio.run(_run())
    logger.info(f"Ses kaydedildi (Edge TTS): {output_path}")
    return output_path


def generate_speech(text: str, filename: str = "narration.mp3") -> Path:
    """
    Seslendirme üret: Google TTS → ElevenLabs → Edge TTS (son yedek).

    Args:
        text: Seslendirilecek metin
        filename: Çıktı dosya adı

    Returns:
        Path: Kaydedilen ses dosyasının yolu
    """
    output_path = AUDIO_DIR / filename

    # İlk: Google TTS → ElevenLabs
    primary_fallback = with_fallback(
        _generate_with_google_tts, _generate_with_elevenlabs, "tts"
    )

    try:
        return primary_fallback(text, output_path)
    except RuntimeError:
        # Her ikisi de başarısız → Edge TTS (asla başarısız olmaz)
        logger.warning("[tts] Google + ElevenLabs başarısız, Edge TTS'e geçiliyor")
        return _generate_with_edge_tts(text, output_path)
