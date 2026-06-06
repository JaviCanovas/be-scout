"""
upload_to_supabase.py - Sube todos los datos scrapeados a Supabase

USO:
  1. Primero ejecuta: python ucam_scraper.py  (genera ucam_players.json)
  2. Luego ejecuta:   python upload_to_supabase.py

  También sube los jugadores ya scrapeados (scraped_players.json) 
  y elimina los datos mock de la base de datos.

Requiere: pip install supabase
"""

import json
import os
import re
import time
import sys

try:
    from supabase import create_client, Client
except ImportError:
    print("[-] Falta el paquete supabase. Ejecuta: pip install supabase")
    sys.exit(1)

# ─── Configuración ─────────────────────────────────────────────────────────────

# Cargar variables del .env.local del proyecto Next.js
def load_env(path="../../../.env.local"):
    """Carga variables de entorno desde un archivo .env.local"""
    env = {}
    if not os.path.exists(path):
        # Intentar rutas alternativas
        for alt in [".env", "../../.env.local", "../.env.local"]:
            if os.path.exists(alt):
                path = alt
                break
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env[key.strip()] = val.strip()
    except FileNotFoundError:
        pass
    return env

env = load_env()
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", ""))
SUPABASE_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[-] Variables de entorno de Supabase no encontradas.")
    print("    Asegúrate de que .env.local existe con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY")
    sys.exit(1)

# ─── Mapeo de posiciones ────────────────────────────────────────────────────────

VALID_POSITIONS = {'POR', 'LD', 'LI', 'DFC', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'}
POSITION_MAP = {
    "PT": "POR", "POR": "POR",
    "DEF": "DFC", "CB": "DFC",
    "MED": "MC", "CEN": "MC", "INT": "MCO",
    "DEL": "DC", "EXT": "ED",
}

def map_pos(pos):
    if not pos:
        return "MC"
    p = str(pos).upper().strip()
    if p in VALID_POSITIONS:
        return p
    return POSITION_MAP.get(p, "MC")

# ─── Conversores de formatos ────────────────────────────────────────────────────

def convert_scraped_player(p):
    """Convierte el formato de scraped_players.json al esquema de la tabla jugadores."""
    nd = p.get("nombre_deportivo", "Desconocido")
    val_raw = p.get("contrato", {}).get("valor_mercado_actual", 0) or 0

    return {
        "id_jugador": p.get("id", ""),
        "nombre_completo": nd,
        "nombre_corto": nd,
        "equipo": p.get("club_actual") or None,
        "posicion": map_pos(p.get("posicion_principal")),
        "imagen_url": p.get("foto") or None,
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
        "valor_mercado": int(val_raw) if val_raw else None,
        "salario": None,
        "fin_contrato": None,
        "prima_tipo": None,
        "prima_cantidad": None,
        "es_propio": False,
        "es_seguido": False,
    }

def convert_ucam_player(p):
    """Convierte el formato de ucam_players.json al esquema de la tabla jugadores."""
    return {
        "id_jugador": p.get("id_jugador", ""),
        "nombre_completo": p.get("nombre_completo", ""),
        "nombre_corto": p.get("nombre_corto", "") or p.get("nombre_completo", ""),
        "equipo": "UCAM CF",
        "posicion": map_pos(p.get("posicion")),
        "imagen_url": p.get("imagen_url") or None,
        "partidos_convocado": p.get("partidos_convocado"),
        "partidos_jugados": p.get("partidos_jugados"),
        "partidos_titular": p.get("partidos_titular"),
        "minutos": p.get("minutos"),
        "goles": p.get("goles"),
        "asistencias": p.get("asistencias"),
        "tarjetas_amarillas": p.get("tarjetas_amarillas"),
        "tarjetas_rojas": p.get("tarjetas_rojas"),
        "ganados": p.get("ganados"),
        "empatados": p.get("empatados"),
        "perdidos": p.get("perdidos"),
        "valor_mercado": p.get("valor_mercado"),
        "salario": None,
        "fin_contrato": None,
        "prima_tipo": None,
        "prima_cantidad": None,
        "es_propio": True,
        "es_seguido": False,
    }

# ─── Subida a Supabase ──────────────────────────────────────────────────────────

def upsert_batch(supabase, records, label=""):
    """Hace upsert en lotes de 50 (límite recomendado de Supabase)."""
    BATCH_SIZE = 50
    total = len(records)
    ok_count = 0

    for i in range(0, total, BATCH_SIZE):
        batch = records[i:i+BATCH_SIZE]
        try:
            res = supabase.table("jugadores").upsert(batch, on_conflict="id_jugador").execute()
            ok_count += len(batch)
            print(f"  [✓] {label} Lote {i//BATCH_SIZE + 1}: {len(batch)} registros subidos.")
        except Exception as e:
            print(f"  [-] Error en lote {i//BATCH_SIZE + 1}: {e}")
        time.sleep(0.5)  # pausa entre lotes

    return ok_count

def delete_mock_data(supabase):
    """Elimina los datos mock de la tabla jugadores.
    
    Los datos mock se identifican porque su equipo no corresponde
    a equipos reales de la zona, o tienen datos claramente ficticios.
    En este caso, simplemente hacemos un DELETE de todos los registros
    con es_propio=false y es_seguido=false que no tengan datos reales.
    
    OPCIÓN SEGURA: Truncamos toda la tabla y rehacemos el insert.
    Esto garantiza limpieza total de mocks.
    """
    print("\n[!] Limpiando tabla jugadores (eliminando mocks)...")
    try:
        # Eliminar todos los registros existentes para reemplazarlos con datos reales
        supabase.table("jugadores").delete().neq("id_jugador", "___imposible___").execute()
        # También limpiar notas privadas (CASCADE debería hacerlo, pero por si acaso)
        supabase.table("notas_privadas").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("  [✓] Tabla limpia.")
    except Exception as e:
        print(f"  [-] Error al limpiar: {e}")
        print("  [!] Continuando de todas formas...")

# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  BeScout — Upload a Supabase")
    print(f"  URL: {SUPABASE_URL[:40]}...")
    print("=" * 60)

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # ── PASO 1: Limpiar mocks ──────────────────────────────────────────────────
    delete_mock_data(supabase)

    all_records = []

    # ── PASO 2: Cargar jugadores scrapeados (base de datos general) ────────────
    if os.path.exists("scraped_players.json"):
        with open("scraped_players.json", "r", encoding="utf-8") as f:
            scraped = json.load(f)
        
        converted = []
        for p in scraped:
            if not p.get("id"):
                continue
            converted.append(convert_scraped_player(p))
        
        print(f"\n[1/2] Subiendo {len(converted)} jugadores scrapeados (base de datos general)...")
        ok = upsert_batch(supabase, converted, "BD General")
        print(f"  → {ok}/{len(converted)} subidos correctamente.")
        all_records.extend(converted)
    else:
        print("[!] No se encontró scraped_players.json — saltando base de datos general.")

    # ── PASO 3: Cargar jugadores de UCAM CF ────────────────────────────────────
    if os.path.exists("ucam_players.json"):
        with open("ucam_players.json", "r", encoding="utf-8") as f:
            ucam_players = json.load(f)

        converted_ucam = []
        for p in ucam_players:
            if not p.get("id_jugador"):
                continue
            converted_ucam.append(convert_ucam_player(p))

        print(f"\n[2/2] Subiendo {len(converted_ucam)} jugadores de UCAM CF (es_propio=true)...")
        ok = upsert_batch(supabase, converted_ucam, "UCAM CF")
        print(f"  → {ok}/{len(converted_ucam)} subidos correctamente.")
    else:
        print("[!] No se encontró ucam_players.json. Ejecuta primero: python ucam_scraper.py")

    print("\n[✓] ¡Proceso completado! Verifica tu tabla en el panel de Supabase.")

if __name__ == "__main__":
    main()
