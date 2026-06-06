import requests
from bs4 import BeautifulSoup

PLAYER_URL = 'https://es.besoccer.com/jugador/d-lorenzo-345101620'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9',
}

print(f"[*] Fetching: {PLAYER_URL}...")
res = requests.get(PLAYER_URL, headers=HEADERS)

if res.status_code == 200:
    print("[✓] Success. Saving debug_player.html...")
    with open('debug_player.html', 'w', encoding='utf-8') as f:
        f.write(res.text)
else:
    print("[-] Request failed with status:", res.status_code)
