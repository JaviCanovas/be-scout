import requests
from bs4 import BeautifulSoup
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html',
}

url = 'https://es.besoccer.com/jugador/palazon-375737'
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

print("Buscando en info-player:")
for div in soup.find_all('div'):
    if div.get('class'):
        if 'age' in div.get('class'):
            print("Age div:", div.get_text(strip=True))

# Buscar en los th
for th in soup.find_all('th'):
    if 'Edad' in th.get_text():
        print("TH Edad found:", th.get_text(strip=True))
        
# A ver que hay en panel-body
for p in soup.find_all('div', class_='panel-body'):
    text = p.get_text(separator=' ', strip=True)
    if 'años' in text.lower():
        print("Panel con años:", text[:100])
        
# Buscar la palabra 'años'
for el in soup.find_all(string=re.compile(r'\baños\b', re.IGNORECASE)):
    print(f"Parent {el.parent.name}:", el.strip())
