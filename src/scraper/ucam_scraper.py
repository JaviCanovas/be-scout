"""
ucam_scraper.py - Scraper completo para UCAM CF (Segunda RFEF Grupo 4)

ANTI-DETECCIÓN:
- Delays aleatorios humanos entre peticiones (3-7s)
- User-Agent rotativo entre varios navegadores modernos
- Cabeceras realistas (Referer, Accept-Encoding, etc.)
- Sesión persistente con cookies
- Sin Playwright / sin JS: solo HTML estático (más difícil de detectar)
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import re
import os

# ─── Configuración Anti-detección ─────────────────────────────────────────────

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
]

BASE_URL = "https://es.besoccer.com"

# URL de la plantilla de UCAM CF - Segunda RFEF Grupo 4
# Slug real en BeSoccer: ucam-murcia-c-f
UCAM_ROSTER_URL = "https://es.besoccer.com/equipo/plantilla/ucam-murcia-c-f"
UCAM_STATS_URL  = "https://es.besoccer.com/equipo/ucam-murcia-c-f"

OUTPUT_FILE = "ucam_players.json"

# ─── Funciones helper ──────────────────────────────────────────────────────────

def get_headers(referer=BASE_URL):
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": referer,
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "DNT": "1",
    }

def polite_sleep(min_s=3.0, max_s=7.0):
    """Pausa humana aleatoria para no saturar el servidor."""
    t = random.uniform(min_s, max_s)
    print(f"  [~] Esperando {t:.1f}s...")
    time.sleep(t)

def safe_get(session, url, referer=BASE_URL, retries=3):
    for attempt in range(retries):
        try:
            res = session.get(url, headers=get_headers(referer), timeout=20)
            if res.status_code == 200:
                return res
            elif res.status_code == 429:
                wait = 30 + random.uniform(10, 20)
                print(f"  [!] Rate-limited (429). Esperando {wait:.0f}s...")
                time.sleep(wait)
            elif res.status_code in (403, 503):
                print(f"  [!] Bloqueado ({res.status_code}) en {url}. Intento {attempt+1}/{retries}")
                time.sleep(15 + random.uniform(5, 10))
            else:
                print(f"  [-] Status {res.status_code} en {url}")
                return None
        except Exception as e:
            print(f"  [-] Excepción: {e}. Intento {attempt+1}/{retries}")
            time.sleep(5)
    return None

def map_posicion(pos_raw):
    """Convierte posiciones de BeSoccer al enum del frontend BeScout.
    
    BeSoccer usa abreviaciones en espanol:
    PT/POR = Portero, LD = Lateral Derecho, LI = Lateral Izquierdo,
    DFC/DEF = Defensa Central, MCD = Mediocentro Defensivo,
    MC/CEN = Mediocentro, MP/MCO = Mediocentro Ofensivo,
    EI/EXT = Extremo Izquierdo, ED = Extremo Derecho,
    DC/DEL = Delantero Centro
    """
    if not pos_raw:
        return "MC"
    pos = pos_raw.upper().strip()
    # Mapa exacto primero (prioridad sobre substrings)
    exact = {
        "PT":  "POR", "POR": "POR", "GK":  "POR",
        "LD":  "LD",  "RB":  "LD",
        "LI":  "LI",  "LB":  "LI",
        "DFC": "DFC", "CB":  "DFC", "DEF": "DFC", "CT": "DFC",
        "MCD": "MCD", "CDM": "MCD", "MED": "MCD", "MD": "MCD",
        "MC":  "MC",  "CM":  "MC",  "CEN": "MC",
        "MP":  "MCO", "MCO": "MCO", "CAM": "MCO", "INT": "MCO",
        "EI":  "EI",  "LW":  "EI",  "EXT": "EI",  "ALI": "EI",
        "ED":  "ED",  "RW":  "ED",
        "DC":  "DC",  "CF":  "DC",  "ST":  "DC",  "DEL": "DC", "9": "DC",
    }
    if pos in exact:
        return exact[pos]
    # Fallback: buscar substring
    for k, v in exact.items():
        if k in pos:
            return v
    return "MC"

# ─── Scraper de plantilla ──────────────────────────────────────────────────────

def get_ucam_roster(session):
    """Extrae todos los links de jugadores de la plantilla de UCAM CF."""
    print(f"[1/3] Extrayendo plantilla UCAM CF de: {UCAM_ROSTER_URL}")
    res = safe_get(session, UCAM_ROSTER_URL, referer=BASE_URL)
    if not res:
        print("[-] No se pudo obtener la plantilla.")
        return []

    soup = BeautifulSoup(res.text, "html.parser")
    player_links = set()

    # BeSoccer: links de jugador en la plantilla tienen /jugador/ en la URL
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/jugador/" in href:
            full = href if href.startswith("http") else BASE_URL + href
            # Solo jugadores con perfil válido, normalizar a es.besoccer.com
            if "besoccer.com/jugador/" in full:
                full = full.replace("www.besoccer.com", "es.besoccer.com")
                player_links.add(full.split("?")[0])  # Eliminar query params

    print(f"  [OK] {len(player_links)} jugadores encontrados en la plantilla.")
    return list(player_links)


def extract_player_stats_from_roster(session, roster_url):
    """Extrae estadísticas de la temporada de un jugador desde su página."""
    res = safe_get(session, roster_url, referer=UCAM_ROSTER_URL)
    if not res:
        return {}

    soup = BeautifulSoup(res.text, "html.parser")
    stats = {
        "partidos_convocado": None,
        "partidos_jugados": None,
        "partidos_titular": None,
        "minutos": None,
        "goles": None,
        "asistencias": None,
        "tarjetas_amarillas": None,
        "tarjetas_rojas": None,
        "ganados": None,
        "empatados": None,
        "perdidos": None,
    }

    # BeSoccer muestra estadísticas en bloques .panel-stats o tablas .stats
    # Intentamos extraer de la tabla de temporadas
    for row in soup.select("table.stats-table tr, .season-stats tr, table tr"):
        cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
        if not cells:
            continue
        text = " ".join(cells).lower()
        # Buscamos la fila de la temporada actual (2024-25 o 2024/25)
        if "2024" in text or "24/25" in text or "24-25" in text:
            nums = re.findall(r'\d+', " ".join(cells))
            if len(nums) >= 5:
                try:
                    stats["partidos_jugados"] = int(nums[1]) if len(nums) > 1 else None
                    stats["partidos_titular"] = int(nums[2]) if len(nums) > 2 else None
                    stats["minutos"] = int(nums[3]) if len(nums) > 3 else None
                    stats["goles"] = int(nums[4]) if len(nums) > 4 else None
                    stats["asistencias"] = int(nums[5]) if len(nums) > 5 else None
                    stats["tarjetas_amarillas"] = int(nums[6]) if len(nums) > 6 else None
                    stats["tarjetas_rojas"] = int(nums[7]) if len(nums) > 7 else None
                except:
                    pass
            break

    return stats


def extract_player_full(url, session):
    """Extrae datos completos de un jugador de su página en BeSoccer."""
    print(f"  -> Extrayendo: {url}")
    res = safe_get(session, url, referer=UCAM_ROSTER_URL)
    if not res:
        return None

    soup = BeautifulSoup(res.text, "html.parser")

    player_id = url.rstrip("/").split("/")[-1]

    player = {
        "id_jugador": player_id,
        "nombre_completo": "",
        "nombre_corto": "",
        "equipo": "UCAM CF",
        "posicion": "MC",
        "imagen_url": None,
        # Stats temporada
        "partidos_convocado": None,
        "partidos_jugados": None,
        "partidos_titular": None,
        "minutos": None,
        "goles": None,
        "asistencias": None,
        "tarjetas_amarillas": None,
        "tarjetas_rojas": None,
        "ganados": None,
        "empatados": None,
        "perdidos": None,
        # Economía
        "valor_mercado": None,
        # Flags
        "es_propio": True,
        "es_seguido": False,
        # Datos extra (no en tabla jugadores, usados en tipo Jugador)
        "_edad": None,
        "_altura": None,
        "_peso": None,
        "_elo": None,
        "_competicion": "Segunda RFEF Grupo 4",
    }

    # ── Nombre ─────────────────────────────────────────────────────────────────
    # Opción A: h1 con clase player-name o similar
    nombre_el = soup.select_one("h1.player-name, h1.player-title, .player-head h1, h1")
    if nombre_el:
        player["nombre_corto"] = nombre_el.get_text(strip=True)
        player["nombre_completo"] = player["nombre_corto"]

    # Fallback: título de la página
    if not player["nombre_corto"]:
        title_el = soup.find("title")
        if title_el:
            title_text = title_el.get_text()
            parts = title_text.split(",")
            if parts:
                player["nombre_corto"] = parts[0].replace("Estadísticas de", "").strip()
                player["nombre_completo"] = player["nombre_corto"]

    # ── Posición ───────────────────────────────────────────────────────────────
    # BeSoccer: la posición principal está en el primer span.player-role.bg-role
    # Ejemplo: <span class="player-role bg-role rol3">MC</span>
    pos_el = soup.select_one("span.player-role.bg-role")
    if pos_el:
        pos_raw = pos_el.get_text(strip=True)
        if pos_raw:
            player["posicion"] = map_posicion(pos_raw)
    
    # Fallback: buscar en data-cy="mainPos" o cualquier bg-role con texto corto
    if player["posicion"] == "MC" and not pos_el:
        for el in soup.select(".bg-role"):
            txt = el.get_text(strip=True)
            if txt and len(txt) <= 4 and txt.isupper() and not txt.isdigit():
                candidate = map_posicion(txt)
                if candidate != "MC" or txt in ("MC", "CEN", "CM"):
                    player["posicion"] = candidate
                    break

    # ── Foto ───────────────────────────────────────────────────────────────────
    img_el = soup.select_one(".player-photo img, .player-img img, .player-head img")
    if img_el:
        src = img_el.get("src") or img_el.get("data-src") or img_el.get("data-lazy")
        if src and "http" in src:
            player["imagen_url"] = src

    # ── Biometría ──────────────────────────────────────────────────────────────
    head_text = ""
    head_el = soup.select_one(".player-head, .player-bio")
    if head_el:
        head_text = head_el.get_text(" ", strip=True)

    # Edad
    edad_match = re.search(r'(\d{1,2})\s*años', head_text, re.IGNORECASE)
    if edad_match:
        player["_edad"] = int(edad_match.group(1))

    # Valor de mercado
    valor_match = re.search(r'([\d,.]+)\s*(M|K)\.?€', head_text, re.IGNORECASE)
    if valor_match:
        val_str = valor_match.group(1).replace(",", ".")
        unidad = valor_match.group(2).upper()
        try:
            val = float(val_str)
            player["valor_mercado"] = int(val * 1_000_000 if unidad == "M" else val * 1000)
        except:
            pass

    # Stats biométricas (peso/altura)
    for stat_el in soup.select(".stat, .player-stat, .bio-stat"):
        txt = stat_el.get_text(" ", strip=True).lower()
        nums = re.findall(r'\d+', txt)
        if "kg" in txt and nums:
            player["_peso"] = int(nums[0])
        elif "cm" in txt and nums:
            player["_altura"] = int(nums[0])

    # ── ELO ───────────────────────────────────────────────────────────────────
    elo_els = soup.select(".elo-val, [class*='elo']")
    for el in elo_els:
        t = el.get_text(strip=True)
        if t.isdigit() and 30 <= int(t) <= 99:
            player["_elo"] = int(t)
            break

    # ── Estadísticas de temporada ──────────────────────────────────────────────
    # Buscamos en tablas de estadísticas por temporada
    for table in soup.select("table"):
        headers = [th.get_text(strip=True).lower() for th in table.select("th")]
        # Tabla que tenga columnas de partidos o goles
        if any(h in headers for h in ["pj", "partidos", "gol", "min", "minutos"]):
            for row in table.select("tr"):
                cells = [td.get_text(strip=True) for td in row.select("td")]
                if not cells:
                    continue
                row_text = " ".join(cells)
                # Fila de temporada actual
                if "2024" in row_text or "24/25" in row_text or "24-25" in row_text:
                    try:
                        nums = re.findall(r'\d+', row_text)
                        if len(nums) >= 4:
                            player["partidos_jugados"] = int(nums[1]) if len(nums) > 1 else None
                            player["partidos_titular"] = int(nums[2]) if len(nums) > 2 else None
                            player["minutos"] = int(nums[3]) if len(nums) > 3 else None
                            player["goles"] = int(nums[4]) if len(nums) > 4 else None
                            player["asistencias"] = int(nums[5]) if len(nums) > 5 else None
                            player["tarjetas_amarillas"] = int(nums[6]) if len(nums) > 6 else None
                            player["tarjetas_rojas"] = int(nums[7]) if len(nums) > 7 else None
                    except:
                        pass
                    break
            break

    return player


# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  BeScout — Scraper UCAM CF (Segunda RFEF Grupo 4)")
    print("  Anti-detección: delays aleatorios + User-Agents rotativos")
    print("=" * 60)

    session = requests.Session()
    # Calentar la sesión visitando la página principal primero (como un humano)
    print("\n[0/3] Calentando sesión en BeSoccer...")
    safe_get(session, BASE_URL, referer="https://www.google.es/")
    polite_sleep(2.0, 4.0)

    # ── PASO 1: Obtener links de jugadores ────────────────────────────────────
    player_links = get_ucam_roster(session)
    if not player_links:
        print("[-] No se encontraron jugadores. Verifica la URL de la plantilla.")
        return

    polite_sleep(4.0, 8.0)

    # ── PASO 2: Extraer datos de cada jugador ─────────────────────────────────
    print(f"\n[2/3] Extrayendo datos de {len(player_links)} jugadores...")

    # Reanudación: no perdemos trabajo si el script se interrumpe
    players_data = []
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            try:
                players_data = json.load(f)
                print(f"  [~] Reanudando: {len(players_data)} jugadores ya guardados.")
            except:
                pass

    done_ids = {p["id_jugador"] for p in players_data}

    for i, url in enumerate(player_links):
        pid = url.rstrip("/").split("/")[-1]
        if pid in done_ids:
            print(f"  [skip] {pid} ya procesado.")
            continue

        print(f"\n  [{i+1}/{len(player_links)}] {pid}")
        player = extract_player_full(url, session)

        if player:
            players_data.append(player)
            done_ids.add(pid)

            # Guardado progresivo cada 5 jugadores
            if len(players_data) % 5 == 0:
                with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                    json.dump(players_data, f, indent=2, ensure_ascii=False)
                print(f"  [SAVE] Checkpoint guardado ({len(players_data)} jugadores)")

        polite_sleep(3.5, 7.0)

    # Guardado final
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(players_data, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Scraping completado. {len(players_data)} jugadores guardados en {OUTPUT_FILE}")
    print("\n[3/3] Ahora ejecuta: python upload_to_supabase.py")


if __name__ == "__main__":
    main()
