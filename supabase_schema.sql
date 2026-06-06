-- Tabla principal de jugadores (sirve tanto para los propios, los seguidos y la base de datos general)
CREATE TABLE IF NOT EXISTS jugadores (
  id_jugador text PRIMARY KEY,
  nombre_completo text NOT NULL,
  nombre_corto text NOT NULL,
  equipo text,
  posicion text,
  imagen_url text,
  
  -- Estadísticas deportivas
  partidos_convocado integer DEFAULT 0,
  partidos_jugados integer DEFAULT 0,
  partidos_titular integer DEFAULT 0,
  minutos integer DEFAULT 0,
  goles integer DEFAULT 0,
  asistencias integer DEFAULT 0,
  tarjetas_amarillas integer DEFAULT 0,
  tarjetas_rojas integer DEFAULT 0,
  ganados integer DEFAULT 0,
  empatados integer DEFAULT 0,
  perdidos integer DEFAULT 0,
  
  -- Valoración económica general (Market Value)
  valor_mercado numeric,
  
  -- Datos de gestión privada BeScout (para la plantilla propia)
  salario numeric,
  fin_contrato date,
  prima_tipo text,
  prima_cantidad numeric,
  
  -- Flags organizativos
  es_propio boolean DEFAULT false,
  es_seguido boolean DEFAULT false
);

-- Tabla de notas privadas, vinculada a cada jugador
CREATE TABLE IF NOT EXISTS notas_privadas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_jugador text REFERENCES jugadores(id_jugador) ON DELETE CASCADE,
  fecha timestamptz DEFAULT now(),
  contenido text NOT NULL
);

-- Habilitar RLS (Row Level Security) para permitir consultas anónimas temporalmente
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_privadas ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir a nuestra app leer y editar libremente (en un entorno de producción, esto debería estar protegido por Auth)
CREATE POLICY "Permitir acceso público total a jugadores" ON jugadores FOR ALL USING (true);
CREATE POLICY "Permitir acceso público total a notas" ON notas_privadas FOR ALL USING (true);
