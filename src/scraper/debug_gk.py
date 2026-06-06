import requests
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9',
}

def debug_player(player_id):
    url = f'https://es.besoccer.com/jugador/{player_id}'
    r = requests.get(url, headers=headers)
    soup = BeautifulSoup(r.text, 'html.parser')

    print(f"\n--- Debug {player_id} ---")
    tables = soup.find_all('table', class_='table_parents')
    if tables:
        for t_idx, table in enumerate(tables):
            print(f"\nTabla {t_idx}")
            ths = table.find_all('th')
            for i, th in enumerate(ths):
                text = th.get_text(strip=True)
                title = th.get('title', '')
                img = th.find('img')
                img_src = img['src'].split('/')[-1] if img else ''
                print(f"TH {i}: '{text}' img: '{img_src}'")
            
            trs = table.find('tbody').find_all('tr') if table.find('tbody') else table.find_all('tr')
            for r_idx, tr in enumerate(trs):
                if tr.find('th'): continue
                tds = [td.get_text(strip=True) for td in tr.find_all('td')]
                print(f"Fila {r_idx}: {tds}")

debug_player('s-de-cea-1005141')
debug_player('montoya-950056')
debug_player('f-ackermann-492759')
