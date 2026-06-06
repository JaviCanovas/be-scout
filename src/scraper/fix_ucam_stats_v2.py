"""
fix_ucam_stats_v2.py - Re-extrae las estadisticas con mapeo dinamico de columnas
para evitar confundir goles encajados (porteros) con goles marcados.
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

def load_env():
    for path in [".env.local", "../../../.env.local", "../../.env.local", "../.env.local"]:
        if os.path.exists(path):
            env = {}
            with open(path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        env[k.strip()] = v.strip()
            return env
    return {}

env = load_env()
URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
supabase = create_client(URL, KEY)

BASE_URL = "https://es.besoccer.com"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
]

def get_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9",
        "Referer": BASE_URL,
    }

def safe_int(val):
    if not val or val == '-': return 0
    val = val.replace("'", "")
    try:
        return int(val)
    except:
        return 0

def extract_stats(player_id: str, session):
    url = f"{BASE_URL}/jugador/{player_id}"
    try:
        r = session.get(url, headers=get_headers(), timeout=15)
        if r.status_code != 200:
            return {}

        soup = BeautifulSoup(r.text, "html.parser")
        table = soup.find('table', class_='table_parents')
        if not table: return {}

        # 1. Mapeo dinamico de columnas
        col_map = {}
        ths = table.find_all('th')
        pj_count = 0
        for i, th in enumerate(ths):
            text = th.get_text(strip=True)
            icon = th.find('span') or th.find('div') or th.find('i')
            classes = icon.get('class', []) if icon else th.get('class', [])
            
            if text == 'PJ':
                if pj_count == 0:
                    col_map['convocado'] = i
                    pj_count += 1
                else:
                    col_map['jugados'] = i
            elif text == 'PT':
                col_map['titular'] = i
            elif text == 'MIN':
                col_map['minutos'] = i
            
            if 'event-1' in classes: col_map['goles'] = i
            if 'event-22' in classes: col_map['asistencias'] = i
            if 'event-5' in classes: col_map['amarillas'] = i
            if 'event-3' in classes: col_map['rojas'] = i

        # 2. Extraer de la primera fila de datos
        tbody = table.find('tbody')
        trs = tbody.find_all('tr') if tbody else table.find_all('tr')
        
        for tr in trs:
            if tr.find('th'): continue
            tds = tr.find_all('td')
            
            def get_val(key):
                if key in col_map and col_map[key] < len(tds):
                    return safe_int(tds[col_map[key]].get_text(strip=True))
                return 0

            return {
                "partidos_convocado": get_val('convocado'),
                "goles": get_val('goles'),
                "asistencias": get_val('asistencias'),
                "tarjetas_amarillas": get_val('amarillas'),
                "tarjetas_rojas": get_val('rojas'),
                "partidos_jugados": get_val('jugados'),
                "partidos_titular": get_val('titular'),
                "minutos": get_val('minutos')
            }
            
        return {}
    except Exception as e:
        print(f"  [-] Error en {player_id}: {e}")
        return {}

def main():
    print("=" * 60)
    print("  BeScout - Correccion de Estadisticas (Mapeo dinamico)")
    print("=" * 60)

    with open("ucam_players.json", "r", encoding="utf-8") as f:
        players = json.load(f)

    session = requests.Session()
    updated = 0

    for i, player in enumerate(players):
        pid = player["id_jugador"]
        print(f"[{i+1}/{len(players)}] {pid}...", end=" ", flush=True)

        stats = extract_stats(pid, session)
        if stats:
            player.update(stats)
            supabase.table("jugadores").update(stats).eq("id_jugador", pid).execute()
            updated += 1
            print(f"OK {stats['partidos_jugados']} PJ, {stats['goles']} Goles")
        else:
            print("Sin estadisticas")

        time.sleep(random.uniform(1.5, 3.0))

    with open("ucam_players.json", "w", encoding="utf-8") as f:
        json.dump(players, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Actualizados: {updated}")

if __name__ == "__main__":
    main()
