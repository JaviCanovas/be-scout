import requests
from bs4 import BeautifulSoup

urls = [
    'https://es.besoccer.com/competicion/equipos/segunda_rfef/4',
    'https://www.besoccer.com/competition/teams/segunda_rfef/4',
    'https://es.besoccer.com/competicion/equipos/segunda_rfef/4/2025'
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
}

for u in urls:
    response = requests.get(u, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    title = soup.find('title').text if soup.find('title') else 'No title'
    print(f"URL: {u}\nTitle: {title}\n")
