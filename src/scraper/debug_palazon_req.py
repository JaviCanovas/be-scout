import requests
from bs4 import BeautifulSoup

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

url = 'https://es.besoccer.com/jugador/palazon-375737'
r = requests.get(url, headers=headers)
print("Status Code:", r.status_code)
if r.status_code == 200:
    soup = BeautifulSoup(r.text, 'html.parser')
    print("Title:", soup.title.string)
    
    table = soup.find('table', class_='table_parents')
    if table:
        print("Table parents found!")
        ths = table.find_all('th')
        for i, th in enumerate(ths):
            if 'Edad' in th.get_text():
                print(f"Edad at column {i}")
                break
