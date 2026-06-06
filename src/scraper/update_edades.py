import requests
from bs4 import BeautifulSoup
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

def safe_int(val):
    if not val or val == '-': return None
    try:
        return int(val)
    except:
        return None

def extract_age(player_id, session):
    url = f"{BASE_URL}/jugador/{player_id}"
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        r = session.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            return None
            
        soup = BeautifulSoup(r.text, "html.parser")
        
        table = soup.find('table', class_='table_parents')
        if table:
            ths = table.find_all('th')
            edad_index = -1
            for i, th in enumerate(ths):
                if 'Edad' in th.get_text(strip=True):
                    edad_index = i
                    break
                    
            if edad_index != -1:
                tbody = table.find('tbody')
                trs = tbody.find_all('tr') if tbody else table.find_all('tr')
                for tr in trs:
                    if tr.find('th'): continue
                    tds = tr.find_all('td')
                    if edad_index < len(tds):
                        return safe_int(tds[edad_index].get_text(strip=True))
                        
        return None
    except Exception as e:
        print(f"[-] Error en {player_id}: {e}")
        return None

def main():
    print("=" * 60)
    print(" BeScout - Scraping Edad y Sub-23 (V2 headers)")
    print("=" * 60)

    # Recuperar jugadores donde edad es NULL
    res = supabase.table("jugadores").select("id_jugador, nombre_corto, edad").is_("edad", "null").execute()
    players = res.data
    if not players:
        print("No se encontraron jugadores sin edad.")
        return
        
    print(f"Se van a procesar {len(players)} jugadores...")
    
    session = requests.Session()
    actualizados = 0

    for i, p in enumerate(players):
        pid = p["id_jugador"]
        print(f"[{i+1}/{len(players)}] {p['nombre_corto']} ({pid})...", end=" ", flush=True)
        
        edad = extract_age(pid, session)
        
        if edad is not None:
            es_sub23 = bool(edad < 23)
            try:
                supabase.table("jugadores").update({
                    "edad": edad,
                    "es_sub23": es_sub23
                }).eq("id_jugador", pid).execute()
                print(f"OK (Edad: {edad}, Sub-23: {'Sí' if es_sub23 else 'No'})")
                actualizados += 1
            except Exception as e:
                print(f"ERROR BBDD: {e}")
        else:
            print("No se encontró la edad en el perfil.")
            
        time.sleep(random.uniform(1.0, 2.5))

    print(f"\n[DONE] Jugadores actualizados: {actualizados}/{len(players)}")

if __name__ == "__main__":
    main()
