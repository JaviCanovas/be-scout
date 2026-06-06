import os
import sys

try:
    from supabase import create_client
except ImportError:
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

def main():
    res = supabase.table("jugadores").select("nombre_corto, posicion").eq("es_propio", True).execute()
    players = res.data
    if not players:
        print("No players found.")
        return
        
    order = ['POR','LD','DFC','LI','MCD','MC','MCO','ED','EI','DC']
    def get_order(p):
        try:
            return order.index(p["posicion"])
        except:
            return 99

    players.sort(key=get_order)
    
    for p in players:
        print(f"{p['nombre_corto']:<20} | {p['posicion']}")

if __name__ == "__main__":
    main()
