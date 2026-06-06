import requests
from bs4 import BeautifulSoup

url = "https://html.duckduckgo.com/html/?q=site:es.besoccer.com/jugador Facundo Ackermann UCAM Murcia"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')
for a in soup.find_all('a', class_='result__url'):
    href = a.get('href', '')
    print(href)
    
