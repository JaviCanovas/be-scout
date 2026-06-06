import requests
from bs4 import BeautifulSoup
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
}
url = 'https://es.besoccer.com/jugador/dani-aquino-27469'
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

print("Title:", soup.title.string if soup.title else "No title")
print("Length:", len(r.text))

# Let's just find the table where we get age. In debug_plantilla it was TH 7.
# In a player profile, where is it?
table = soup.find('table', class_='table_parents')
if table:
    ths = table.find_all('th')
    for i, th in enumerate(ths):
        if 'Edad' in th.get_text():
            print(f"Edad found at column {i}")
            
    tbody = table.find('tbody')
    if tbody:
        for tr in tbody.find_all('tr'):
            if tr.find('th'): continue
            tds = tr.find_all('td')
            if len(tds) > 11:
                print("Row data:", [td.get_text(strip=True) for td in tds])
                break
