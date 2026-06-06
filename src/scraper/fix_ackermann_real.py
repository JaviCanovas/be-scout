import requests
from bs4 import BeautifulSoup
import os
import sys

try:
    from supabase import create_client
except ImportError:
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

def fix_ackermann():
    old_id = "f-ackermann-492759"
    new_id = "facundo-136724" # The correct BeSoccer ID for Facundo Ackermann
    
    url = f"{BASE_URL}/jugador/{new_id}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive"
    }
    
    print(f"Fetching {url}...")
    r = requests.get(url, headers=headers)
    
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        
        name_div = soup.find('div', class_='name')
        if name_div:
            full_name = name_div.get_text(strip=True)
            print(f"Encontrado nombre completo: {full_name}")
            
            title_text = soup.title.string if soup.title else ""
            short_name = full_name.split(' ')[0]
            if 'Estadísticas de ' in title_text:
                short_name = title_text.split('Estadísticas de ')[1].split(',')[0].strip()
            
            print(f"Nombre corto: {short_name}")
            
            updates = {
                "id_jugador": new_id,
                "nombre_completo": full_name,
                "nombre_corto": short_name,
                "posicion": "POR",
            }
            
            img = soup.find('img', class_='player-img')
            if img and img.has_attr('src'):
                updates["imagen_url"] = img['src']
                
            try:
                # Update changing ID and names!
                supabase.table("jugadores").update(updates).eq("id_jugador", old_id).execute()
                print("Jugador actualizado con éxito a Facundo Ackermann en Supabase.")
            except Exception as e:
                print(f"Error BBDD: {e}")
        else:
            print("No se encontró el div.name")
    else:
        print(f"Status {r.status_code}")

if __name__ == "__main__":
    fix_ackermann()
