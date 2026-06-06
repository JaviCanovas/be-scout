import requests
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html',
}

url = 'https://es.besoccer.com/jugador/dani-aquino-27469'
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

print("--- Paneles de info ---")
for panel in soup.find_all('div', class_='panel-body'):
    text = panel.get_text(separator=' ', strip=True)
    if 'contrato' in text.lower() or 'contract' in text.lower():
        print("Panel con contrato:", text)

# Tambien buscar en boxes o listas
for li in soup.find_all('li'):
    text = li.get_text(separator=' ', strip=True)
    if 'contrato' in text.lower():
        print("LI con contrato:", text)
        
for tr in soup.find_all('tr'):
    text = tr.get_text(separator=' ', strip=True)
    if 'contrato' in text.lower():
        print("TR con contrato:", text)

for div in soup.find_all('div', class_='box-info'):
    print("Box Info:", div.get_text(separator=' ', strip=True))
