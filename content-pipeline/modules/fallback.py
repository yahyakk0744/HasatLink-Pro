"""
Fallback (Yedekleme) Yöneticisi
Her aşamada: Ana API dene → hata/limit → Yedek API'ye geç
"""
import time
import logging
from functools import wraps
from config.settings import MAX_RETRIES, RETRY_DELAY_SEC

logger = logging.getLogger("hasatlink-pipeline")


def with_fallback(primary_fn, fallback_fn, stage_name: str):
    """
    Ana fonksiyonu dene, başarısız olursa yedek fonksiyona geç.

    Args:
        primary_fn: Ana API fonksiyonu
        fallback_fn: Yedek API fonksiyonu
        stage_name: Log için aşama adı (ör. "metin", "gorsel", "tts")

    Returns:
        Başarılı fonksiyonun sonucu
    """
    def executor(*args, **kwargs):
        # 1) Ana API dene
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info(f"[{stage_name}] Ana API deneniyor (deneme {attempt}/{MAX_RETRIES})")
                result = primary_fn(*args, **kwargs)
                logger.info(f"[{stage_name}] Ana API başarılı")
                return result
            except Exception as e:
                logger.warning(f"[{stage_name}] Ana API hata (deneme {attempt}): {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SEC)

        # 2) Yedek API'ye geç
        logger.info(f"[{stage_name}] Yedek API'ye geçiliyor...")
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info(f"[{stage_name}] Yedek API deneniyor (deneme {attempt}/{MAX_RETRIES})")
                result = fallback_fn(*args, **kwargs)
                logger.info(f"[{stage_name}] Yedek API başarılı")
                return result
            except Exception as e:
                logger.warning(f"[{stage_name}] Yedek API hata (deneme {attempt}): {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SEC)

        raise RuntimeError(f"[{stage_name}] Tüm API'ler başarısız oldu!")

    return executor
