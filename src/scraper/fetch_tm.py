import requests
from bs4 import BeautifulSoup
import re

url = "https://html.duckduckgo.com/html/?q=site:transfermarkt.es+UCAM+Murcia+plantilla+detallada"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

tm_url = None
for a in soup.find_all('a', class_='result__url'):
    href = a.get('href', '')
    if 'transfermarkt.es' in href and 'kader' in href:
        tm_url = href.split('uddg=')[1].split('&')[0]
        import urllib.parse
        tm_url = urllib.parse.unquote(tm_url)
        break

if not tm_url:
    tm_url = "https://www.transfermarkt.es/ucam-murcia-cf/kader/verein/37578/saison_id/2024"

print(f"URL TM: {tm_url}")

headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
r2 = requests.get(tm_url, headers=headers)
soup2 = BeautifulSoup(r2.text, 'html.parser')

items = soup2.select('table.items tbody tr.odd, table.items tbody tr.even')
for item in items:
    td_player = item.find('td', class_='posrela')
    if not td_player: continue
    
    td_main = td_player.find_all('td')
    if len(td_main) < 2: continue
    
    name_a = td_main[1].find('a')
    if not name_a: continue
    
    name = name_a.get_text(strip=True)
    pos = td_main[1].find_all('tr')[1].get_text(strip=True) if len(td_main[1].find_all('tr')) > 1 else ""
    
    print(f"{name} -> {pos}")
