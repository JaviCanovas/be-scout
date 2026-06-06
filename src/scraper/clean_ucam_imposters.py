"""
clean_ucam_imposters.py - Elimina de Supabase los jugadores que NO son de UCAM CF
y que se colaron en el scraping (Anthony Gordon, Kai Havertz, Rafael Leão, etc.)

Los jugadores legítimos de UCAM CF usan el escudo con ID 6056 en BeSoccer.
Los impostores tienen escudos de sus clubs reales (Premier, Serie A, etc.)
"""

import json
import os
import sys
import time

try:
    from supabase import create_client
except ImportError:
    print("[-] pip install supabase")
    sys.exit(1)

# ─── Cargar credenciales ───────────────────────────────────────────────────────

def load_env(path="../../../.env.local"):
    env = {}
    for alt in [path, ".env.local", "../../.env.local", "../.env.local", ".env"]:
        if os.path.exists(alt):
            with open(alt, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        env[k.strip()] = v.strip()
            break
    return env

env = load_env()
URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not URL or not KEY:
    print("[-] Variables de entorno no encontradas.")
    sys.exit(1)

supabase = create_client(URL, KEY)

# ─── Lógica de detección de impostores ────────────────────────────────────────

# Escudo legítimo de UCAM CF en BeSoccer
UCAM_SHIELD_ID = "6056"

# IDs conocidos de impostores detectados por el usuario
KNOWN_IMPOSTERS = {
    "a-gordon-427689",     # Anthony Gordon (Newcastle)
    "k-havertz-320354",   # Kai Havertz (Arsenal)
    "r-leao-325795",      # Rafael Leão (AC Milan)
    "a-robinson-294869",  # Antonee Robinson (Fulham)
    "g-guedes-201156",    # Gonçalo Guedes
    "facundo-136724",     # F. Ackermann (no es de UCAM)
}

def is_imposter(player: dict) -> bool:
    """Detecta impostores por escudo o por lista negra."""
    pid = player.get("id_jugador", "")
    
    # Lista negra explícita
    if pid in KNOWN_IMPOSTERS:
        return True
    
    # Detección por escudo: si la imagen NO contiene el ID del escudo UCAM
    img = player.get("imagen_url") or ""
    if img and UCAM_SHIELD_ID not in img and "resfu.com" in img:
        return True
    
    # Detección por valor de mercado absurdo para un jugador de Segunda RFEF
    # (un jugador de Segunda RFEF no vale más de 2M€)
    valor = player.get("valor_mercado") or 0
    if valor > 2_000_000:
        return True
    
    return False

# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  BeScout — Limpieza de impostores en plantilla UCAM CF")
    print("=" * 60)

    # Cargar JSON local para limpiarlo también
    json_file = "ucam_players.json"
    if not os.path.exists(json_file):
        print(f"[-] No se encontró {json_file}")
        return

    with open(json_file, "r", encoding="utf-8") as f:
        players = json.load(f)

    imposters = [p for p in players if is_imposter(p)]
    legit = [p for p in players if not is_imposter(p)]

    print(f"\n[!] Jugadores totales en JSON: {len(players)}")
    print(f"[!] Impostores detectados:     {len(imposters)}")
    print(f"[✓] Jugadores legítimos:       {len(legit)}")
    print()

    if imposters:
        print("Impostores a eliminar:")
        for p in imposters:
            print(f"  - {p['id_jugador']}: {p.get('nombre_completo', '')} (VM: €{p.get('valor_mercado', 0):,.0f})")

        print()

        # Eliminar de Supabase
        ids_to_delete = [p["id_jugador"] for p in imposters]
        print(f"[1/2] Eliminando {len(ids_to_delete)} impostores de Supabase...")
        try:
            res = supabase.table("jugadores").delete().in_("id_jugador", ids_to_delete).execute()
            print(f"  [OK] Eliminados de Supabase.")
        except Exception as e:
            print(f"  [-] Error: {e}")

        # Limpiar JSON local
        print(f"[2/2] Actualizando {json_file} ({len(legit)} jugadores legítimos)...")
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(legit, f, indent=2, ensure_ascii=False)
        print(f"  [OK] JSON actualizado.")
    else:
        print("[OK] No se detectaron impostores.")

    print(f"\n[DONE] Plantilla UCAM CF limpia: {len(legit)} jugadores.")

if __name__ == "__main__":
    main()
