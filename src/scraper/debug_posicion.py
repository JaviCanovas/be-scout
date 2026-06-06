import requests
from bs4 import BeautifulSoup
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.8",
}

def check_pos(pid):
    url = f'https://es.besoccer.com/jugador/{pid}'
    r = requests.get(url, headers=headers)
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # 1. En el header de la pagina, a veces dice "Posicion: Defensa" 
    meta_desc = soup.find('meta', {'name': 'description'})
    if meta_desc:
        print(f"Meta: {meta_desc.get('content')}")
        
    # 2. box-info o role
    roles = soup.find_all(string=re.compile('Extremo|Lateral|Punta|Mediocentro|Central|Delantero|Defensa', re.I))
    for rol in roles:
        if len(rol) < 40:
            print(f"Found text: {rol.strip()}")

check_pos('j-lucas-1018334')
check_pos('palazon-375737')
