import requests
from bs4 import BeautifulSoup

url = 'https://es.besoccer.com/search?q=Segunda+RFEF+Grupo+4'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
}

print(f"[*] Buscando en {url}...")
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    results = soup.select('a')
    for a in results:
        if 'href' in a.attrs and 'competicion' in a['href']:
            print(a['href'])
else:
    print("[-] Request failed with status:", response.status_code)
