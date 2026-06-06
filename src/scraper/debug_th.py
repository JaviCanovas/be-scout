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

table = soup.find('table', class_='table_parents')
if table:
    ths = table.find_all('th')
    for i, th in enumerate(ths):
        text = th.get_text(strip=True)
        # Buscar el elemento que tiene la clase de icono
        icon = th.find('span') or th.find('div') or th.find('i')
        icon_class = icon.get('class') if icon else th.get('class')
        print(f"TH {i}: '{text}' icon_class: {icon_class}")
