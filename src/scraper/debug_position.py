import requests
from bs4 import BeautifulSoup

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

print('\n--- TITLE ---')
t = soup.find('title')
print(t.text[:120] if t else 'None')

print('\n--- bg-role elements ---')
for el in soup.select('.bg-role'):
    print(f'  class={el.get("class")} text={repr(el.get_text(strip=True))}')

print('\n--- player-head/info text (500 chars) ---')
for sel in ['.player-head', '.player-info', '.info-box', '.player-resume']:
    head = soup.select_one(sel)
    if head:
        print(f'Selector: {sel}')
        print(head.get_text(' ', strip=True)[:500])
        break

print('\n--- Elementos con posiciones conocidas ---')
known = {'POR','LD','LI','DFC','MCD','MC','MCO','EI','ED','DC','PT','DEF','MED','DEL','EXT','INT'}
for el in soup.find_all(['span','div','p','li','td']):
    txt = el.get_text(strip=True)
    if txt in known and not el.find_all(True):  # solo elementos hoja
        parent_class = str(el.parent.get('class', '')) if el.parent else ''
        el_class = str(el.get('class', ''))
        print(f'  <{el.name} class="{el_class}"> "{txt}" | parent <{el.parent.name} class="{parent_class}">')

print('\n--- Buscando role en HTML raw (primeras 50 apariciones de "role") ---')
import re
matches = list(re.finditer(r'role|posicion|demarcacion', r.text, re.IGNORECASE))
for m in matches[:5]:
    start = max(0, m.start()-50)
    end = min(len(r.text), m.end()+100)
    print(f'  ...{r.text[start:end].strip()[:200]}...')
    print()
