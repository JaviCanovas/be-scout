import requests
from bs4 import BeautifulSoup
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9',
}

url = 'https://es.besoccer.com/equipo/plantilla/ucam-murcia-c-f'
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

print("--- Plantilla UCAM CF ---")
table = soup.find('table', class_='table_parents') or soup.find('table')
if table:
    ths = table.find_all('th')
    for i, th in enumerate(ths):
        text = th.get_text(strip=True)
        icon = th.find('span') or th.find('div') or th.find('i')
        icon_class = icon.get('class') if icon else th.get('class')
        print(f"TH {i}: '{text}' icon_class: {icon_class}")

    trs = table.find('tbody').find_all('tr') if table.find('tbody') else table.find_all('tr')
    for r_idx, tr in enumerate(trs):
        if tr.find('th'): continue
        name_el = tr.find('div', class_='name') or tr.find('a')
        name = name_el.get_text(strip=True) if name_el else "Unknown"
        tds = [td.get_text(strip=True) for td in tr.find_all('td')]
        if len(tds) > 1:
            print(f"{name}: {tds}")
