import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('http://localhost:3000')
        await asyncio.sleep(5)
        await page.screenshot(path='login_debug.png')
        await browser.close()

asyncio.run(run())
