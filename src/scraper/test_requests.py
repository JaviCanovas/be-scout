import requests
from bs4 import BeautifulSoup

TARGET_URL = 'https://es.besoccer.com/competicion/clasificacion/segunda_division_rfef/2026/grupo4'

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
}

print(f"[*] Navigating to {TARGET_URL} via requests...")
response = requests.get(TARGET_URL, headers=headers)

print(f"[*] Status code: {response.status_code}")
if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    links = soup.select('a[href*="/equipo/"]')
    
    print("[-] Saving debug_requests.html...")
    with open('debug_requests.html', 'w', encoding='utf-8') as f:
        f.write(response.text)

    unique_links = list(set([a['href'] for a in links if '/partidos/' not in a['href'] and '/fichajes/' not in a['href']]))
    print(f"[✓] Found {len(unique_links)} teams:")
    for l in sorted(unique_links):
        print(" ->", l)
else:
    print("[-] Request failed.")
