"""
TikTok Upload — Playwright ile headless browser üzerinden yükleme.
n8n'den çağrılır: python upload_tiktok.py "video_path" "description"

NOT: TikTok'un resmi API'si creator hesabı gerektiriyor.
Bu script Playwright ile tarayıcı otomasyonu kullanır.
İlk çalıştırmada manuel giriş yapman gerekir (cookie kaydedilir).
"""
import sys
import asyncio
import logging
from pathlib import Path

logger = logging.getLogger("hasatlink-pipeline")

COOKIE_FILE = Path(__file__).parent.parent / "config" / "tiktok_cookies.json"


async def upload_to_tiktok(video_path: str, description: str):
    """TikTok'a video yükle (Playwright)."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.error("playwright yüklü değil: pip install playwright && playwright install chromium")
        return

    async with async_playwright() as p:
        # Cookie varsa kullan (session persist)
        browser = await p.chromium.launch(headless=False)

        if COOKIE_FILE.exists():
            import json
            cookies = json.loads(COOKIE_FILE.read_text())
            context = await browser.new_context()
            await context.add_cookies(cookies)
        else:
            context = await browser.new_context()

        page = await context.new_page()
        await page.goto("https://www.tiktok.com/upload", wait_until="networkidle")

        # Giriş kontrolü
        if "login" in page.url.lower():
            logger.warning("TikTok girişi gerekli! Tarayıcıda giriş yap...")
            await page.wait_for_url("**/upload**", timeout=120000)

            # Cookie'leri kaydet
            cookies = await context.cookies()
            import json
            COOKIE_FILE.write_text(json.dumps(cookies))
            logger.info("TikTok cookie'leri kaydedildi")

        # Video yükle
        file_input = page.locator('input[type="file"]')
        await file_input.set_input_files(video_path)
        await page.wait_for_timeout(5000)

        # Açıklama yaz
        caption_editor = page.locator('[data-contents="true"]').first
        await caption_editor.click()
        await page.keyboard.type(description[:2200])
        await page.wait_for_timeout(2000)

        # Yayınla
        post_button = page.locator('button:has-text("Post"), button:has-text("Yayınla")')
        await post_button.click()
        await page.wait_for_timeout(10000)

        logger.info("TikTok'a yüklendi!")
        await browser.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Kullanım: python upload_tiktok.py <video_path> <description>")
        sys.exit(1)

    asyncio.run(upload_to_tiktok(sys.argv[1], sys.argv[2]))
