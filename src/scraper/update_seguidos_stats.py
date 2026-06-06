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
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

def safe_int(val):
    if not val or val == '-': return None
    val = val.replace("'", "")
    try:
        return int(val)
    except:
        return None

def extract_player_extra_info(player_id, session):
    url = f"{BASE_URL}/jugador/{player_id}"
    try:
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        r = session.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            return None, None
            
        soup = BeautifulSoup(r.text, "html.parser")
        
        # 1. Extraer Fin de contrato
        fin_contrato = None
        for panel in soup.find_all('div', class_='panel-body'):
            text = panel.get_text(separator=' ', strip=True)
            if 'Fin de contrato' in text:
                parts = text.split('Fin de contrato')
                if len(parts) > 1:
                    fc_part = parts[1].strip().split(' ')[0]
                    # Solo nos quedamos con el año si es de formato 30/06/2026
                    if '/' in fc_part:
                        fin_contrato = fc_part.split('/')[-1]
                    elif fc_part.isdigit() and len(fc_part) == 4:
                        fin_contrato = fc_part

        # 2. Extraer Minutos (de table_parents, primera fila)
        minutos = None
        table = soup.find('table', class_='table_parents')
        if table:
            ths = table.find_all('th')
            min_index = -1
            for i, th in enumerate(ths):
                if th.get_text(strip=True) == 'MIN':
                    min_index = i
                    break
                    
            if min_index != -1:
                tbody = table.find('tbody')
                trs = tbody.find_all('tr') if tbody else table.find_all('tr')
                for tr in trs:
                    if tr.find('th'): continue
                    tds = tr.find_all('td')
                    if min_index < len(tds):
                        minutos = safe_int(tds[min_index].get_text(strip=True))
                        break # cogemos la primera fila (temporada actual)
                        
        return fin_contrato, minutos
    except Exception as e:
        print(f"[-] Error en {player_id}: {e}")
        return None, None

def main():
    print("=" * 60)
    print(" BeScout - Scraping Minutos y Fin de Contrato (BBDD)")
    print("=" * 60)

    # Solo coger jugadores que NO sean del equipo propio (es_propio=false)
    # y opcionalmente los que tengan minutos/contrato vacio (o actualizarlos todos)
    res = supabase.table("jugadores").select("id_jugador, nombre_corto").eq("es_propio", False).execute()
    players = res.data
    if not players:
        print("No se encontraron jugadores.")
        return
        
    print(f"Se van a procesar {len(players)} jugadores...")
    
    session = requests.Session()
    actualizados = 0

    for i, p in enumerate(players):
        pid = p["id_jugador"]
        print(f"[{i+1}/{len(players)}] {p['nombre_corto']} ({pid})...", end=" ", flush=True)
        
        fc, mins = extract_player_extra_info(pid, session)
        
        updates = {}
        if fc is not None:
            updates["fin_contrato"] = str(fc)
        if mins is not None:
            updates["minutos"] = mins
            
        if updates:
            try:
                supabase.table("jugadores").update(updates).eq("id_jugador", pid).execute()
                print(f"OK (Min: {mins}, Contrato: {fc})")
                actualizados += 1
            except Exception as e:
                print(f"ERROR BBDD: {e}")
        else:
            print("Sin datos nuevos.")
            
        time.sleep(random.uniform(1.0, 2.5))

    print(f"\n[DONE] Jugadores actualizados: {actualizados}/{len(players)}")

if __name__ == "__main__":
    main()
