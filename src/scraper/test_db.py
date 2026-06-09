import os
import sys
from supabase import create_client

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
client = create_client(URL, KEY)

try:
    # Check all own players
    res_propio = client.table("jugadores").select("id_jugador, nombre_corto, es_propio, es_seguido").eq("es_propio", True).execute()
    print("Own players count in DB:", len(res_propio.data))
    if res_propio.data:
        print("First own player details:", res_propio.data[0])

    # Check followed players
    res_seguido = client.table("jugadores").select("id_jugador, nombre_corto, es_propio, es_seguido").eq("es_seguido", True).execute()
    print("Followed players count in DB:", len(res_seguido.data))
    if res_seguido.data:
        print("First followed player details:", res_seguido.data[0])

    # Check combined query using .or_()
    res_or = client.table("jugadores").select("id_jugador, nombre_corto, es_propio, es_seguido").or_("es_seguido.eq.true,es_propio.eq.true").execute()
    print("Combined .or_() query count:", len(res_or.data))
except Exception as e:
    print("Error:", e)
