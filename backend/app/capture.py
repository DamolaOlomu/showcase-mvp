"""
Automated screenshot capture using Playwright.

For each URL we grab:
- A full-page desktop screenshot (for the design detail page)
- A full-page mobile screenshot (for the design detail page)
- A desktop *viewport* screenshot — just the visible area, not the full
  scroll — which is what gets sent to the AI vision model. Full-page
  screenshots of long sites can be enormous (10,000+ px tall); the viewport
  shot is plenty of signal for category/style/color detection and keeps the
  vision call fast and cheap.

Requires the Chromium browser binary, which is a separate install step:
    playwright install chromium
"""
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

from app.config import settings

DESKTOP_VIEWPORT = {"width": 1440, "height": 900}
MOBILE_VIEWPORT = {"width": 390, "height": 844}


class CaptureError(Exception):
    pass


async def capture_website(url: str) -> dict[str, bytes]:
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            try:
                desktop_page = await browser.new_page(viewport=DESKTOP_VIEWPORT)
                await desktop_page.goto(
                    url, wait_until="networkidle", timeout=settings.capture_timeout_ms
                )
                desktop_viewport_bytes = await desktop_page.screenshot(full_page=False, type="png")
                desktop_full_bytes = await desktop_page.screenshot(full_page=True, type="png")
                await desktop_page.close()

                mobile_page = await browser.new_page(viewport=MOBILE_VIEWPORT, is_mobile=True)
                await mobile_page.goto(
                    url, wait_until="networkidle", timeout=settings.capture_timeout_ms
                )
                mobile_full_bytes = await mobile_page.screenshot(full_page=True, type="png")
                await mobile_page.close()
            finally:
                await browser.close()
    except PlaywrightTimeoutError:
        raise CaptureError(
            "That site took too long to load. Check the URL and try again, "
            "or upload screenshots manually below."
        )
    except Exception as e:
        raise CaptureError(f"Couldn't capture that website: {e}")

    return {
        "desktop_full": desktop_full_bytes,
        "desktop_viewport": desktop_viewport_bytes,
        "mobile_full": mobile_full_bytes,
    }
