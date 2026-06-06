import requests
from bs4 import BeautifulSoup
import json
import re
import time
import random

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Connection': 'keep-alive'
}

def extract_player_data(url, session):
    res = session.get(url, headers=HEADERS)
    if res.status_code != 200:
        print(f"[-] Status {res.status_code} for {url}")
        return None

    soup = BeautifulSoup(res.text, 'html.parser')
    
    player = {
        "id": url.split('/')[-1],
        "nombre_deportivo": "",
        "nombre": "",
        "apellidos": "",
        "foto": "",
        "club_actual": "",
        "posicion_principal": "ND",
        "posicion_secundaria": None,
        "biometria": {
            "fecha_nacimiento": "ND",
            "edad": None,
            "nacionalidad": "es",
            "peso": None,
            "altura": None,
            "pie_bueno": "ND"
        },
        "estadisticas": {
            "temporadas": []
        },
        "contrato": {
            "fin": "ND",
            "valor_mercado_actual": 0,
            "historico_valor": []
        },
        "elo": None
    }

    head = soup.select_one('.player-head')
    if head:
        head_text = head.text.strip()
        
        # Position
        roles = head.select('.bg-role')
        for r in roles:
            r_txt = r.text.strip()
            if not r_txt.isdigit() and len(r_txt) <= 3:
                player["posicion_principal"] = r_txt
                
        # Age
        for word in head_text.split():
            if 'años' in word.lower():
                try:
                    idx = head_text.lower().find('años')
                    age_str = head_text[idx-3:idx].strip()
                    if age_str.isdigit():
                        player["biometria"]["edad"] = int(age_str)
                except:
                    pass
            elif 'K.€' in word or 'M.€' in word:
                val = 0
                try:
                    idx = head_text.find(word)
                    val_str = head_text[max(0, idx-5):idx].strip()
                    val = float(val_str.replace(',','.'))
                    if 'M.' in word:
                        val *= 1000000
                    elif 'K.' in word:
                        val *= 1000
                    player["contrato"]["valor_mercado_actual"] = int(val)
                except:
                    pass

    # Name fallback
    title_el = soup.find('title')
    if title_el:
        t_parts = title_el.text.split(',')
        if len(t_parts) > 0:
            player["nombre_deportivo"] = t_parts[0].replace('Estadísticas de', '').strip()
        if len(t_parts) > 1:
            player["club_actual"] = t_parts[1].split('|')[0].strip()

    # Biometrics from inner stats
    stats = soup.select('.stat')
    for s in stats:
        txt = s.text.lower()
        if 'kgs' in txt:
            nums = re.findall(r'\d+', txt)
            if nums: player["biometria"]["peso"] = int(nums[0])
        elif 'cms' in txt:
            nums = re.findall(r'\d+', txt)
            if nums: player["biometria"]["altura"] = int(nums[0])
            
    # ELO rating
    elo_tags = soup.select('.elo-val, [class*="elo"]')
    for e in elo_tags:
        t = e.text.strip()
        if t.isdigit() and 30 <= int(t) <= 99:
            player["elo"] = int(t)
            break
            
    # Photo
    # Evitar escoger la del club (que a veces está dentro de p-head)
    img = soup.select_one('.player-photo img')
    if img and img.get('src'):
        player["foto"] = img['src']

    return player

def main():
    print("[*] Testing player extractor over true links...")
    import json
    with open('debug_team_players.json', 'r') as f:
        urls = json.load(f)[:3]
        
    results = []
    session = requests.Session()
    for u in urls:
        print(f" -> {u}")
        try:
            p = extract_player_data(u, session)
            if p:
                results.append(p)
        except Exception as e:
            print(f"    Exception: {e}")
        time.sleep(random.uniform(1.5, 3.0))
        
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
