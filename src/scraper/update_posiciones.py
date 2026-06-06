import requests
from bs4 import BeautifulSoup
import time
import random
import os
import sys
import re

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

def extract_specific_position(player_id, session):
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
        
        roles = soup.find_all(string=re.compile('Extremo|Lateral|Punta|Mediocentro|Central|Delantero|Defensa|Portero', re.I))
        
        # 1. Buscar roles específicos primero (2 palabras o mas)
        for rol in roles:
            val = rol.strip().lower()
            if len(val) < 40 and len(val) > 2:
                if 'derecho' in val and 'lateral' in val: return 'LD'
                if 'izquierdo' in val and 'lateral' in val: return 'LI'
                if 'derecho' in val and 'extremo' in val: return 'ED'
                if 'izquierdo' in val and 'extremo' in val: return 'EI'
                if 'ofensivo' in val or 'media punta' in val or 'mediapunta' in val: return 'MCO'
                if 'defensivo' in val or 'pivote' in val: return 'MCD'
                if 'central' in val and ('defensa' in val or len(val) < 15): return 'DFC'
                
        # 2. Buscar roles genéricos
        for rol in roles:
            val = rol.strip().lower()
            if len(val) < 40 and len(val) > 2:
                if 'mediocentro' in val or 'medio' in val: return 'MC'
                if 'delantero' in val or 'punta' in val: return 'DC'
                if 'extremo' in val: return 'ED' # Asumimos ED por defecto si no especifica
                if 'lateral' in val: return 'LD'
                if 'defensa' in val: return 'DFC'
                if 'portero' in val: return 'POR'
                
        return None
    except Exception as e:
        print(f"[-] Error en {player_id}: {e}")
        return None

def main():
    print("=" * 60)
    print(" BeScout - Extrayendo posiciones específicas")
    print("=" * 60)

    # Obtenemos TODOS los jugadores propios
    res = supabase.table("jugadores").select("id_jugador, nombre_corto, posicion").eq("es_propio", True).execute()
    players = res.data
    if not players:
        print("No se encontraron jugadores.")
        return
        
    print(f"Se van a procesar {len(players)} jugadores...")
    
    session = requests.Session()
    actualizados = 0

    for i, p in enumerate(players):
        pid = p["id_jugador"]
        old_pos = p["posicion"]
        print(f"[{i+1}/{len(players)}] {p['nombre_corto']} (Actual: {old_pos})...", end=" ", flush=True)
        
        new_pos = extract_specific_position(pid, session)
        
        if new_pos and new_pos != old_pos:
            try:
                supabase.table("jugadores").update({"posicion": new_pos}).eq("id_jugador", pid).execute()
                print(f"-> Actualizado a: {new_pos}")
                actualizados += 1
            except Exception as e:
                print(f"ERROR BBDD: {e}")
        else:
            print(f"-> Se mantiene {old_pos} (Detectado: {new_pos})")
            
        time.sleep(random.uniform(1.0, 2.0))

    print(f"\n[DONE] Jugadores actualizados: {actualizados}/{len(players)}")

if __name__ == "__main__":
    main()
