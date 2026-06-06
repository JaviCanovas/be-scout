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
    val = val.replace("'", "")
    try:
        return int(val)
    except:
        return None

def extract_player_extra_info(player_id, session):
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
                    if '/' in fc_part:
                        año = fc_part.split('/')[-1]
                        fin_contrato = f"{año}-06-30"
                    elif fc_part.isdigit() and len(fc_part) == 4:
                        fin_contrato = f"{fc_part}-06-30"

        # 2. Extraer Minutos
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
                        break # Cogemos la primera fila (temporada actual)
                        
        return fin_contrato, minutos
    except Exception as e:
        print(f"[-] Error en {player_id}: {e}")
        return None, None

def main():
    print("=" * 60)
    print(" BeScout - Scraping Minutos y Fin de Contrato (V2)")
    print("=" * 60)

    # Obtenemos TODOS los jugadores que no tienen fin de contrato (para no re-hacer los que ya tengan)
    # y también podemos filtrar los es_propio=False porque los de la plantilla propia se suelen meter a mano,
    # pero podemos hacerlo para todos los que lo tengan nulo.
    res = supabase.table("jugadores").select("id_jugador, nombre_corto, fin_contrato, minutos").execute()
    players = res.data
    if not players:
        print("No se encontraron jugadores.")
        return
        
    # Filtrar aquellos que no tienen fin_contrato o minutos, o que no son de la plantilla propia.
    to_update = [p for p in players if (not p.get("fin_contrato") or not p.get("minutos"))]
        
    print(f"Se van a procesar {len(to_update)} jugadores...")
    
    session = requests.Session()
    actualizados = 0

    for i, p in enumerate(to_update):
        pid = p["id_jugador"]
        print(f"[{i+1}/{len(to_update)}] {p['nombre_corto']} ({pid})...", end=" ", flush=True)
        
        fc, mins = extract_player_extra_info(pid, session)
        
        updates = {}
        if fc is not None and not p.get("fin_contrato"):
            updates["fin_contrato"] = str(fc)
        if mins is not None and not p.get("minutos"):
            updates["minutos"] = mins
            
        if updates:
            try:
                supabase.table("jugadores").update(updates).eq("id_jugador", pid).execute()
                print(f"OK (Min: {mins}, Contrato: {fc})")
                actualizados += 1
            except Exception as e:
                print(f"ERROR BBDD: {e}")
        else:
            print("Sin datos nuevos / oculto.")
            
        time.sleep(random.uniform(1.0, 2.5))

    print(f"\n[DONE] Jugadores actualizados: {actualizados}/{len(to_update)}")

if __name__ == "__main__":
    main()
