import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Connection': 'keep-alive'
}

def get_team_roster(team_url, session):
    # Convert equipo to equipo/plantilla if missing
    if '/equipo/' in team_url and '/plantilla/' not in team_url:
        team_url = team_url.replace('/equipo/', '/equipo/plantilla/')
        
    print(f"[*] Extracting roster for: {team_url}")
    res = session.get(team_url, headers=HEADERS)
    if res.status_code != 200:
        print(f"[-] Status {res.status_code}")
        return []

    soup = BeautifulSoup(res.text, 'html.parser')
    player_links = set()
    links = soup.find_all('a', href=True)
    for a in links:
        href = a['href']
        if '/jugador/' in href and 'http' in href:
            player_links.add(href)
            
    return list(player_links)

def main():
    if not os.path.exists('team_links.json'):
        print("[-] Missing team_links.json")
        return

    with open('team_links.json', 'r', encoding='utf-8') as f:
        teams = json.load(f)

    print(f"[*] Starting roster extraction for {len(teams)} teams.")
    session = requests.Session()
    all_players = set()

    # For testing, we can limit to 5 teams if we just want a fast MVP generator.
    # The user wants "Test and generate scraped_players.json". 
    # Let's extract all teams but maybe later we limit the players we scrape to not trigger WAF on 1000 requests.
    for i, t in enumerate(teams):
        print(f"\n--- Equipo {i+1}/{len(teams)} ---")
        players = get_team_roster(t, session)
        print(f"[✓] {len(players)} players found.")
        for p in players:
            all_players.add(p)
        time.sleep(random.uniform(1.0, 2.5))
        
    all_p_list = list(all_players)
    print(f"\n[*] Total Unique Players across all teams: {len(all_p_list)}")
    
    with open('player_links.json', 'w', encoding='utf-8') as f:
        json.dump(all_p_list, f, indent=4)
        print("[+] Guardado en player_links.json")

if __name__ == '__main__':
    main()
