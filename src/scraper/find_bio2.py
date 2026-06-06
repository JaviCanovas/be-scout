from bs4 import BeautifulSoup

def find_bio():
    with open('debug_player.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    with open('inspect_output.txt', 'w', encoding='utf-8') as out:
        out.write("--- Player Head Panel ---\n")
        
        # In BeSoccer, the top player panel has a specific class like 'player-head' or 'head-content'
        panels = soup.select('.player-head, .head-content, .panel, .box')
        for i, p in enumerate(panels[:15]):
            txt = p.text.strip().replace('\n', ' ')
            if 0 < len(txt) < 300:
                out.write(f"PANEL {i} classes={p.get('class')}:\n{txt}\n\n")

        out.write("--- All generic divs with short text ---\n")
        divs = soup.find_all('div')
        count = 0
        for d in divs:
            txt = d.text.strip()
            # If the text has 'Edad' or 'kg' or 'cm'
            if ('Edad' in txt or 'kg' in txt or 'cm' in txt or 'Valor' in txt) and len(txt) < 50:
                out.write(f"Found keyword '{txt}' in div with classes: {d.get('class')}\n")
                if d.parent:
                    out.write(f"  Parent classes: {d.parent.get('class')}\n")
                count += 1
            if count > 20:
                break

if __name__ == '__main__':
    find_bio()
