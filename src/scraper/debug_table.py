import requests
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9',
}
url = 'https://es.besoccer.com/jugador/alberto-soto-871747'
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

print("Status:", r.status_code)
tables = soup.find_all('table', class_='table_parents')
print(f"Tablas encontradas: {len(tables)}")

if tables:
    for t_idx, table in enumerate(tables):
        print(f"\n--- Tabla {t_idx} ---")
        ths = table.find_all('th')
        for i, th in enumerate(ths):
            text = th.get_text(strip=True)
            title = th.get('title', '')
            img = th.find('img')
            img_src = img['src'] if img else ''
            print(f"TH {i}: text='{text}', title='{title}', img='{img_src}'")
        
        trs = table.find('tbody').find_all('tr') if table.find('tbody') else table.find_all('tr')
        if len(trs) > 1:
            # saltamos la cabecera si es tr
            row = trs[1] if trs[0].find('th') else trs[0]
            for i, td in enumerate(row.find_all('td')):
                text = td.get_text(strip=True)
                print(f"TD {i}: text='{text}'")
