from bs4 import BeautifulSoup
import json

def test_parse():
    with open('debug_player.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    data = {}

    # Name 
    name_el = soup.find('h2', {'class': 'title'}) or soup.find('div', {'class': 'name'})
    data['nombre_deportivo'] = name_el.text.strip() if name_el else None
    
    # ELO
    elo_el = soup.select_one('.pvbox-elo-val, .elo-val, .panel-elo')
    data['elo'] = elo_el.text.strip() if elo_el else None

    # Biometrics
    bio_table = soup.select_one('.player-info')
    if bio_table:
        data['bio_text'] = bio_table.text.replace('\n', ' ').strip()
        
    print(json.dumps(data, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    test_parse()
