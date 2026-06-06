import json

def convert():
    with open('scraped_players.json', 'r', encoding='utf-8') as f:
        scraped = json.load(f)
        
    converted = []
    
    # Mapeo de posiciones de BeSoccer al enum del frontend
    # BeSoccer a veces usa "PT" (Portero), nosotros usamos "POR".
    # "DEF" -> "DFC"
    # "MED" -> "MC"
    # "DEL" -> "DC"
    def map_pos(pos):
        pos = pos.upper() if pos else "MC"
        if pos == "PT": return "POR"
        if pos == "DEF": return "DFC"
        if pos == "MED": return "MC"
        if pos == "DEL": return "DC"
        if pos == "INT": return "MC"
        if pos == "EX": return "ED"
        if pos == "EXT": return "ED"
        valid_pos = ['POR', 'LD', 'LI', 'DFC', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC']
        if pos in valid_pos:
            return pos
        return "MC" # Default
        
    for p in scraped:
        nd = p.get("nombre_deportivo", "Desconocido")
        # En el frontend, nombre_completo se usa para separar.
        # Si no tenemos, ponemos nombre_deportivo
        
        c = {
            "id_jugador": p.get("id", ""),
            "nombre_completo": nd + " (Scraped)",
            "nombre_corto": nd,
            "puntuacion_elo": p.get("elo"),
            "biometria": {
                "edad": p.get("biometria", {}).get("edad"),
                "peso": p.get("biometria", {}).get("peso"),
                "altura": p.get("biometria", {}).get("altura"),
                "pie_dominante": "Diestro" # mock
            },
            "club_actual": p.get("club_actual"),
            "ultimo_club": None,
            "competicion": "Liga Mock", # Podríamos sacarlo si guardamos ese dato
            "posicion": map_pos(p.get("posicion_principal")),
            "posicion_detalle": "Titular",
            "posicion_secundaria": map_pos(p.get("posicion_secundaria")) if p.get("posicion_secundaria") else None,
            "estadisticas": {
                "partidos_jugados": 0,
                "partidos_titular": 0,
                "minutos_totales": 0,
                "goles": 0,
                "asistencias": 0,
                "tarjetas_amarillas": 0,
                "tarjetas_rojas": 0
            },
            "contrato": {
                "fin_contrato": str(p.get("contrato", {}).get("fin")) if p.get("contrato", {}).get("fin") != "ND" else None,
                "estado": "Propiedad",
                "agente": None,
                "valor_mercado": p.get("contrato", {}).get("valor_mercado_actual")
            },
            "imagen_url": p.get("foto")
        }
        converted.append(c)
        
    with open('../data/mocks/jugadores_db.json', 'w', encoding='utf-8') as out:
        json.dump(converted, out, indent=4, ensure_ascii=False)
        
    print(f"[+] Convertidos {len(converted)} jugadores al formato Jugador y guardados en jugadores_db.json")

if __name__ == '__main__':
    convert()
