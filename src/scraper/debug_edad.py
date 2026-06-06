import requests
import re
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html',
}

url = 'https://es.besoccer.com/jugador/dani-aquino-27469'
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

print("Buscando '35' o 'Edad'...")
texts = soup.find_all(string=re.compile(r'35|Edad', re.IGNORECASE))
for t in texts:
    parent = t.parent
    if parent:
        print(f"[{parent.name} class={parent.get('class')}] {t.strip()}")
