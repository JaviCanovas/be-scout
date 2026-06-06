from bs4 import BeautifulSoup

def find_bio():
    with open('debug_player.html', 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    # Find name
    for el in soup.find_all(text=lambda t: t and 'A. Morales' in t):
        if el.parent.name not in ['title', 'script', 'style', 'meta', 'link', 'noscript']:
            print(f"NAME TAG: {el.parent.name}, CLASSES: {el.parent.get('class')}")
            print(f"TEXT: {el.parent.text.strip()}")
            if el.parent.parent:
                print(f"PARENT CLASSES: {el.parent.parent.get('class')}")
                print("---")

    # Find age or numbers
    # We know he is U19, so maybe age is 17 or 18.
    print("\nExtracting all top panel texts:")
    # BeSoccer usually puts the bio in a div.panel or div.box
    panels = soup.select('.panel, .box, [class*="player-"]')
    for i, p in enumerate(panels[:15]):
        txt = p.text.strip().replace('\n', ' ')
        if 0 < len(txt) < 300:
            print(f"PANEL {i} classes={p.get('class')}: {txt[:100]}")

if __name__ == '__main__':
    find_bio()
