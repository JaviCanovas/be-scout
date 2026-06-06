import requests
from bs4 import BeautifulSoup
import json

URLS = [
    'https://es.besoccer.com/competicion/clasificacion/segunda_division_rfef/2026/grupo4',
    'https://es.besoccer.com/competicion/clasificacion/tercera_division_rfef/2026/grupo13',
    'https://es.besoccer.com/competicion/clasificacion/division_honor_juvenil/2026/grupo7'
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9',
}

def get_team_links(url):
    print(f"[*] Extrayendo equipos de: {url}")
    response = requests.get(url, headers=HEADERS)
    if response.status_code != 200:
        print(f"[-] Error HTTP {response.status_code}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    team_links = set()

    # Find the standings table
    tables = soup.find_all('table')
    for table in tables:
        # Search for rows in the table body
        tbody = table.find('tbody')
        if not tbody:
            continue
            
        rows = tbody.find_all('tr')
        for row in rows:
            # The team link is usually in a <td> with class 'name' or just the first/second <a> tag
            links = row.find_all('a', href=True)
            for a in links:
                href = a['href']
                if '/equipo/' in href and '/partidos/' not in href and '/fichajes/' not in href and '/plantilla/' not in href and '/clasificacion/' not in href:
                    team_links.add(href)

    return list(team_links)

def main():
    all_teams = []
    
    for url in URLS:
        links = get_team_links(url)
        print(f"  -> Encontrados {len(links)} equipos válidos en la tabla.")
        all_teams.extend(links)
        
    all_teams = list(set(all_teams))
    print(f"\n[✓] Extracción completada. Total equipos únicos a trackear: {len(all_teams)}")
    
    with open('team_links.json', 'w', encoding='utf-8') as f:
        json.dump(all_teams, f, indent=4)
        
    print("[*] Guardados en 'team_links.json'.")

if __name__ == '__main__':
    main()
