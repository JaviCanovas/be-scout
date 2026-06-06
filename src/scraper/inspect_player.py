from bs4 import BeautifulSoup
import json

def parse_full_player():
    with open('debug_player.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    data = {}
    
    # 1. Names and basic info
    title = soup.find('title')
    data['page_title'] = title.text if title else ''
    
    # 2. Key-Value pairs often found in definitions or lists
    for el in soup.select('.player-info, .box-info-player, .info-player, .data-player'):
        data['bio_block'] = el.text.strip().replace('\n', ' ')

    # 3. Tables (stats)
    stats_tables = soup.select('table')
    data['tables'] = len(stats_tables)
    
    # Let's just find anything with 'Edad', 'Nacimiento', 'Estatura', 'Valor', 'Contrato'
    for tag in soup.find_all(text=True):
        txt = tag.strip()
        if txt in ['Edad', 'Nacimiento', 'Altura', 'Peso', 'Valor', 'Contrato']:
            # The value is usually in the next element or a sibling.
            parent = tag.parent
            if parent:
                data[txt] = parent.parent.text.strip().replace('\n', ' ')

    with open('parsed_player_schema.json', 'w', encoding='utf-8') as jf:
        json.dump(data, jf, indent=4, ensure_ascii=False)

if __name__ == '__main__':
    parse_full_player()
