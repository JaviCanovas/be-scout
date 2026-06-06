import os
import sys

try:
    from supabase import create_client
except ImportError:
    print("[-] pip install supabase")
    sys.exit(1)

def load_env():
    for path in [".env.local", "../../../.env.local", "../../.env.local", "../.env.local"]:
        if os.path.exists(path):
            env = {}
            with open(path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        env[k.strip()] = v.strip()
            return env
    return {}

env = load_env()
URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
supabase = create_client(URL, KEY)

pid_ackermann = "f-ackermann-492759"
stats = {
    "partidos_convocado": 32,
    "partidos_jugados": 32,
    "partidos_titular": 32,
    "minutos": 2880, # 32 * 90
    "goles": 0,
    "asistencias": 0,
    "tarjetas_amarillas": 4,
    "tarjetas_rojas": 0
}

try:
    supabase.table("jugadores").update(stats).eq("id_jugador", pid_ackermann).execute()
    print("[OK] Stats de F. Ackermann actualizadas correctamente.")
except Exception as e:
    print(f"[-] Error: {e}")
