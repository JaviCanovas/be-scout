import requests
from bs4 import BeautifulSoup
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Referer': 'https://es.besoccer.com',
}

url = 'https://es.besoccer.com/jugador/alberto-soto-871747'
r = requests.get(url, headers=headers, timeout=15)
print(f'Status: {r.status_code}')

soup = BeautifulSoup(r.text, 'html.parser')

print('\n--- Estadísticas ---')
# BeSoccer suele tener una tabla de estadísticas de la temporada actual.
# Buscamos elementos con clases relacionadas con stats
stat_elements = soup.select('.stat-value, .stat-label, td')
for el in soup.find_all(['table', 'div'], class_=re.compile('stat', re.I)):
    if 'class' in el.attrs:
        print(f"Encontrado div/table con clase: {el['class']}")

print('\n--- Tablas ---')
for table in soup.find_all('table'):
    print(table.get('class', 'Sin clase'))
    th_texts = [th.get_text(strip=True) for th in table.find_all('th')]
    if th_texts:
         print(f"Cabeceras: {th_texts}")
    
    # Ver la primera fila de datos
    tr = table.find('tr')
    if tr:
        tr2 = tr.find_next_sibling('tr')
        if tr2:
             tds = [td.get_text(strip=True) for td in tr2.find_all('td')]
             print(f"Datos fila 1: {tds}")

print('\n--- Paneles de rendimiento ---')
for box in soup.select('.box-stat, .stat-box, .performance-box, .player-stats'):
    print(f"Box: {box.get('class')}")
    print(box.get_text(' ', strip=True)[:200])
