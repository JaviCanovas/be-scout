"""
fix_ucam_positions.py - Re-extrae posicion y nombre limpio para los 27 jugadores
ya guardados en ucam_players.json y actualiza Supabase con los datos correctos.

Mas rapido que el scraper completo: solo dos campos por jugador.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import re
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
UCAM_SHIELD_ID = "6056"

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

def map_posicion(pos_raw):
    """Mapa exacto de posiciones BeSoccer -> enum BeScout."""
    if not pos_raw:
        return None
    pos = pos_raw.upper().strip()
    exact = {
        "PT": "POR", "POR": "POR", "GK": "POR",
        "LD": "LD",  "RB": "LD",
        "LI": "LI",  "LB": "LI",
        "DFC": "DFC", "CB": "DFC", "DEF": "DFC", "CT": "DFC",
        "MCD": "MCD", "CDM": "MCD", "MED": "MCD", "MD": "MCD",
        "MC": "MC",   "CM": "MC",  "CEN": "MC",
        "MP": "MCO",  "MCO": "MCO", "CAM": "MCO", "INT": "MCO",
        "EI": "EI",   "LW": "EI",  "EXT": "EI",  "ALI": "EI",
        "ED": "ED",   "RW": "ED",
        "DC": "DC",   "CF": "DC",  "ST": "DC",   "DEL": "DC",
    }
    if pos in exact:
        return exact[pos]
    for k, v in exact.items():
        if k in pos:
            return v
    return None

def clean_name(raw_name: str) -> str:
    """Elimina el prefijo 'Estadísticas ' que pone BeSoccer en el <title>."""
    prefixes = ["Estadísticas de ", "Estadísticas ", "Statistics of ", "Statistics "]
    for prefix in prefixes:
        if raw_name.startswith(prefix):
            raw_name = raw_name[len(prefix):]
    # Eliminar sufijo de club " | BeSoccer" o ", UCAM..."
    raw_name = re.split(r',\s*(UCAM|Real|FC|CF|SD|CD|UD)', raw_name)[0].strip()
    return raw_name

def extract_pos_and_name(player_id: str, session):
    url = f"{BASE_URL}/jugador/{player_id}"
    try:
        r = session.get(url, headers=get_headers(), timeout=15)
        if r.status_code != 200:
            print(f"  [-] {r.status_code} en {url}")
            return None, None

        soup = BeautifulSoup(r.text, "html.parser")

        # ── Nombre desde h1 ──────────────────────────────────────────────────
        nombre = None
        h1 = soup.select_one("h1.player-name, h1.player-title, .player-head h1, h1")
        if h1:
            nombre = h1.get_text(strip=True)
        if not nombre:
            title_el = soup.find("title")
            if title_el:
                nombre = clean_name(title_el.get_text())

        # ── Posicion desde span.player-role.bg-role ───────────────────────────
        posicion = None
        pos_el = soup.select_one("span.player-role.bg-role")
        if pos_el:
            posicion = map_posicion(pos_el.get_text(strip=True))

        # Fallback: primer .bg-role con texto corto y mayusculas
        if not posicion:
            for el in soup.select(".bg-role"):
                txt = el.get_text(strip=True)
                if txt and len(txt) <= 4 and txt.isupper() and not txt.isdigit():
                    posicion = map_posicion(txt)
                    if posicion:
                        break

        return nombre, posicion
    except Exception as e:
        print(f"  [-] Error: {e}")
        return None, None

def main():
    print("=" * 60)
    print("  BeScout - Correccion de posiciones UCAM CF")
    print("=" * 60)

    with open("ucam_players.json", "r", encoding="utf-8") as f:
        players = json.load(f)

    print(f"\n[!] {len(players)} jugadores a actualizar")

    session = requests.Session()
    updated = 0
    errors = 0

    for i, player in enumerate(players):
        pid = player["id_jugador"]
        print(f"\n  [{i+1}/{len(players)}] {pid}")

        nombre, posicion = extract_pos_and_name(pid, session)

        if nombre:
            nombre = clean_name(nombre)
            player["nombre_completo"] = nombre
            player["nombre_corto"] = nombre
            print(f"    Nombre: {nombre}")
        if posicion:
            player["posicion"] = posicion
            print(f"    Posicion: {posicion}")
        else:
            print(f"    Posicion: NO ENCONTRADA (mantiene {player.get('posicion', '?')})")

        # Actualizar en Supabase
        update_data = {}
        if nombre:
            update_data["nombre_completo"] = nombre
            update_data["nombre_corto"] = nombre
        if posicion:
            update_data["posicion"] = posicion

        if update_data:
            try:
                supabase.table("jugadores").update(update_data).eq("id_jugador", pid).execute()
                updated += 1
            except Exception as e:
                print(f"    [-] Error Supabase: {e}")
                errors += 1

        # Delay anti-deteccion (mas corto porque solo leemos un campo)
        delay = random.uniform(2.5, 5.0)
        print(f"    [~] Esperando {delay:.1f}s...")
        time.sleep(delay)

    # Guardar JSON actualizado
    with open("ucam_players.json", "w", encoding="utf-8") as f:
        json.dump(players, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Actualizados: {updated} | Errores: {errors}")
    print("[OK] ucam_players.json guardado con nombres y posiciones correctas.")

if __name__ == "__main__":
    main()
