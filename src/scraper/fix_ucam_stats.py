"""
fix_ucam_stats.py - Re-extrae las estadisticas (PC, PJ, PT, Min, Gol, Asist, Amarillas, Rojas)
para los 27 jugadores ya guardados en ucam_players.json y actualiza Supabase.
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

# ─── Credenciales ─────────────────────────────────────────────────────────────

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
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
]

def get_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9",
        "Referer": BASE_URL,
    }

def safe_int(val):
    if not val or val == '-': return None
    val = val.replace("'", "") # quitar la comilla de los minutos
    try:
        return int(val)
    except:
        return None

def extract_stats(player_id: str, session):
    url = f"{BASE_URL}/jugador/{player_id}"
    try:
        r = session.get(url, headers=get_headers(), timeout=15)
        if r.status_code != 200:
            print(f"  [-] {r.status_code} en {url}")
            return {}

        soup = BeautifulSoup(r.text, "html.parser")
        
        stats = {}
        # Buscar la tabla de estadisticas
        table = soup.find('table', class_='table_parents')
        if table:
            tbody = table.find('tbody')
            # Coger las filas de datos
            trs = tbody.find_all('tr') if tbody else table.find_all('tr')
            for tr in trs:
                if tr.find('th'): continue # Saltar cabecera
                
                tds = tr.find_all('td')
                if len(tds) >= 11:
                    # En la tabla de BeSoccer:
                    # TD 0: Equipo
                    # TD 1: Temporada
                    # TD 2: PC (Partidos Convocado)
                    # TD 3: Goles
                    # TD 4: Asistencias
                    # TD 5: Amarillas
                    # TD 6: Rojas
                    # TD 7: PJ (Partidos Jugados)
                    # TD 8: PT (Partidos Titulares)
                    # TD 9: PS (Partidos Suplente)
                    # TD 10: MIN
                    
                    stats = {
                        "partidos_convocado": safe_int(tds[2].get_text(strip=True)),
                        "goles": safe_int(tds[3].get_text(strip=True)),
                        "asistencias": safe_int(tds[4].get_text(strip=True)),
                        "tarjetas_amarillas": safe_int(tds[5].get_text(strip=True)),
                        "tarjetas_rojas": safe_int(tds[6].get_text(strip=True)),
                        "partidos_jugados": safe_int(tds[7].get_text(strip=True)),
                        "partidos_titular": safe_int(tds[8].get_text(strip=True)),
                        "minutos": safe_int(tds[10].get_text(strip=True))
                    }
                    break # Solo cogemos la primera fila (temporada actual/ultima)
        return stats
    except Exception as e:
        print(f"  [-] Error: {e}")
        return {}

def main():
    print("=" * 60)
    print("  BeScout - Extraccion de estadisticas deportivas UCAM CF")
    print("=" * 60)

    with open("ucam_players.json", "r", encoding="utf-8") as f:
        players = json.load(f)

    print(f"\n[!] {len(players)} jugadores a actualizar")

    session = requests.Session()
    updated = 0

    for i, player in enumerate(players):
        pid = player["id_jugador"]
        print(f"\n  [{i+1}/{len(players)}] {pid}")

        stats = extract_stats(pid, session)
        
        if stats:
            # Imprimir para log
            print(f"    Estadisticas encontradas: {stats}")
            # Actualizar localmente
            player.update(stats)
            
            # Actualizar en Supabase
            try:
                supabase.table("jugadores").update(stats).eq("id_jugador", pid).execute()
                updated += 1
                print(f"    [OK] Supabase actualizado.")
            except Exception as e:
                print(f"    [-] Error Supabase: {e}")
        else:
            print(f"    [-] Sin estadisticas")

        delay = random.uniform(2.5, 4.5)
        print(f"    [~] Esperando {delay:.1f}s...")
        time.sleep(delay)

    # Guardar JSON
    with open("ucam_players.json", "w", encoding="utf-8") as f:
        json.dump(players, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Estadisticas actualizadas: {updated}")

if __name__ == "__main__":
    main()
