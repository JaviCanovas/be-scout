import json
import time
import random
import os
import requests
from level2_players import extract_player_data

def main():
    if not os.path.exists('player_links.json'):
        print("[-] Falta player_links.json")
        return

    with open('player_links.json', 'r', encoding='utf-8') as f:
        urls = json.load(f)

    # IMPORTANTE: Para la Fase 1 del MVP, limitamos a 50 jugadores al azar
    # o los primeros 50 para no tardar 1 hora en terminar. 
    # Para extraer la base de datos completa, simplemente cambia LIMIT a = len(urls)
    LIMIT = 50
    urls = urls[:LIMIT]

    scraped_data = []
    output_file = 'scraped_players.json'
    
    # Lógica de reanudación: si se corta, no perdemos lo descargado
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            try:
                scraped_data = json.load(f)
            except:
                pass
                
    scraped_ids = {p['id'] for p in scraped_data}
    
    session = requests.Session()
    # Usamos las mismas buenas cabeceras
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Connection': 'keep-alive'
    })

    print(f"[*] Iniciando extracción masiva. Objetivo: {len(urls)} jugadores. Ya extraídos: {len(scraped_ids)}")
    
    added = 0
    for i, u in enumerate(urls):
        pid = u.split('/')[-1]
        if pid in scraped_ids:
            continue
            
        print(f"[{i+1}/{len(urls)}] Extrayendo: {u}")
        try:
            player = extract_player_data(u, session)
            if player:
                scraped_data.append(player)
                added += 1
                
                # Guardado progresivo cada 10 jugadores
                if added % 10 == 0:
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(scraped_data, f, indent=4, ensure_ascii=False)
                    print("  [+] Punto de guardado.")
        except Exception as e:
            print(f"  [-] Error procesando {u}: {e}")
            
        # Pausa humana aleatoria
        time.sleep(random.uniform(1.2, 2.5))

    # Guardado final
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(scraped_data, f, indent=4, ensure_ascii=False)
        
    print(f"\n[✓] Extracción completada. Total jugadores en DB: {len(scraped_data)}")

if __name__ == '__main__':
    main()
