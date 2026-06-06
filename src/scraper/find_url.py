import asyncio
from playwright.async_api import async_playwright

async def find_league_url():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        )
        page = await context.new_page()
        print("[*] Going to besoccer.com...")
        await page.goto('https://es.besoccer.com/')
        
        print("[*] Waiting for search bar...")
        await page.wait_for_selector('input[type="text"]', timeout=5000)
        
        print("[*] Typing query...")
        await page.fill('input[type="text"]', 'Segunda RFEF Grupo 4')
        await page.wait_for_timeout(2000) # wait for autocomplete dropdown
        
        print("[*] Taking screenshot of search results...")
        await page.screenshot(path='search_results.png')
        
        html = await page.content()
        with open('search_results.html', 'w', encoding='utf-8') as f:
            f.write(html)
            
        await browser.close()
        print("[+] Check search_results.png")

if __name__ == '__main__':
    asyncio.run(find_league_url())
