import requests
from bs4 import BeautifulSoup

# We use /equipo/plantilla/ as BeSoccer tends to put the roster there
TEAM_URL = 'https://es.besoccer.com/equipo/plantilla/almeria-b'
# the original link extracted was https://es.besoccer.com/equipo/almeria-b
# so we replace /equipo/ with /equipo/plantilla/

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9',
}

print(f"[*] Fetching: {TEAM_URL}...")
res = requests.get(TEAM_URL, headers=HEADERS)
print(f"Status: {res.status_code}")

if res.status_code == 200:
    soup = BeautifulSoup(res.text, 'html.parser')
    player_links = set()
    
    # Normally inside a <div class="player-list"> or similar. We look for /jugador/
    links = soup.find_all('a', href=True)
    for a in links:
        href = a['href']
        if '/jugador/' in href and 'http' in href:
            player_links.add(href)
            
    import json
    with open('debug_team_players.json', 'w', encoding='utf-8') as f:
        json.dump(list(player_links), f, indent=4)
        
    for p in sorted(list(player_links))[:5]:
        print(" ->", p)
        res_p = requests.get(p, headers=HEADERS)
        print(f"    Status: {res_p.status_code}")
        if res_p.status_code == 200:
            with open('debug_player.html', 'w', encoding='utf-8') as pf:
                pf.write(res_p.text)
            break
