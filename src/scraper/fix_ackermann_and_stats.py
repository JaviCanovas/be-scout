"""
fix_ackermann_and_stats.py
Añade a F. Ackermann de vuelta a la BD y re-extrae stats SOLO del primer equipo ("UCAM Murcia")
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
import sys

try:
    from supabase import create_client
except ImportError:
    print("[-] pip install supabase")
    sys.exit(1)

env = {}
for path in [".env.local", "../../../.env.local", "../../.env.local", "../.env.local"]:
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()

URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
supabase = create_client(URL, KEY)

BASE_URL = "https://es.besoccer.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
    "Referer": BASE_URL,
}

def safe_int(val):
    if not val or val == '-': return 0
    val = val.replace("'", "")
    try: return int(val)
    except: return 0

def get_player_data(player_id):
    url = f"{BASE_URL}/jugador/{player_id}"
    r = requests.get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200: return None

    soup = BeautifulSoup(r.text, "html.parser")
    
    # Datos básicos
    name = soup.find('div', class_='name').get_text(strip=True) if soup.find('div', class_='name') else "F. Ackermann"
    
    # Extraer stats
    stats = {
        "partidos_convocado": 0, "goles": 0, "asistencias": 0, "tarjetas_amarillas": 0,
        "tarjetas_rojas": 0, "partidos_jugados": 0, "partidos_titular": 0, "minutos": 0
    }
    
    table = soup.find('table', class_='table_parents')
    if table:
        col_map = {}
        ths = table.find_all('th')
        pj_count = 0
        for i, th in enumerate(ths):
            text = th.get_text(strip=True)
            icon = th.find('span') or th.find('div') or th.find('i')
            classes = icon.get('class', []) if icon else th.get('class', [])
            
            if text == 'PJ':
                if pj_count == 0: col_map['convocado'] = i
                else: col_map['jugados'] = i
                pj_count += 1
            elif text == 'PT': col_map['titular'] = i
            elif text == 'MIN': col_map['minutos'] = i
            
            if 'event-1' in classes: col_map['goles'] = i
            if 'event-22' in classes: col_map['asistencias'] = i
            if 'event-5' in classes: col_map['amarillas'] = i
            if 'event-3' in classes: col_map['rojas'] = i

        tbody = table.find('tbody')
        trs = tbody.find_all('tr') if tbody else table.find_all('tr')
        
        for tr in trs:
            if tr.find('th'): continue
            tds = tr.find_all('td')
            if not tds: continue
            
            equipo = tds[0].get_text(strip=True)
            # Solo queremos stats del UCAM Murcia (NO "UCAM Murcia B" ni "Illueca")
            if equipo.lower() == 'ucam murcia':
                def get_val(key):
                    if key in col_map and col_map[key] < len(tds):
                        return safe_int(tds[col_map[key]].get_text(strip=True))
                    return 0

                stats = {
                    "partidos_convocado": get_val('convocado'),
                    "goles": get_val('goles'),
                    "asistencias": get_val('asistencias'),
                    "tarjetas_amarillas": get_val('amarillas'),
                    "tarjetas_rojas": get_val('rojas'),
                    "partidos_jugados": get_val('jugados'),
                    "partidos_titular": get_val('titular'),
                    "minutos": get_val('minutos')
                }
                break
                
    return name, stats

def main():
    print("Recuperando a F. Ackermann...")
    # 1. Recuperar Ackermann
    pid_ackermann = "f-ackermann-492759"
    name, stats = get_player_data(pid_ackermann)
    
    ackermann_data = {
        "id_jugador": pid_ackermann,
        "nombre_completo": name,
        "nombre_corto": name,
        "equipo": "UCAM CF",
        "es_propio": True,
        "posicion": "POR",
        "imagen_url": f"https://cdn.resfu.com/img_data/jugadores/medium/{pid_ackermann}.jpg",
        **stats
    }
    
    # Insertar en Supabase (hacer upsert por si aca)
    try:
        supabase.table("jugadores").upsert(ackermann_data).execute()
        print(f"[OK] F. Ackermann restaurado con stats: {stats}")
    except Exception as e:
        print(f"[-] Error restaurando Ackermann: {e}")
        
    # 2. Corregir TODOS los demás jugadores para asegurar que solo tengan stats de "UCAM Murcia"
    with open("ucam_players.json", "r", encoding="utf-8") as f:
        players = json.load(f)
        
    # Añadir ackermann al JSON si no esta
    if not any(p["id_jugador"] == pid_ackermann for p in players):
        players.append(ackermann_data)
        
    for p in players:
        pid = p["id_jugador"]
        if pid == pid_ackermann: continue
        
        _, p_stats = get_player_data(pid)
        print(f"Corrigiendo {pid}... {p_stats['partidos_jugados']} PJ para UCAM Murcia")
        
        p.update(p_stats)
        supabase.table("jugadores").update(p_stats).eq("id_jugador", pid).execute()
        time.sleep(1)

    with open("ucam_players.json", "w", encoding="utf-8") as f:
        json.dump(players, f, indent=2, ensure_ascii=False)
        
    print("¡Hecho!")

if __name__ == "__main__":
    main()
