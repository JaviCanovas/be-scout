export interface Biometria {
    edad: number | null;
    peso: number | null; // en kg
    altura: number | null; // en cm
    pie_dominante: 'Diestro' | 'Zurdo' | 'Ambidiestro' | null;
}

export interface Estadisticas {
    partidos_jugados: number | null;
    partidos_titular: number | null;
    minutos_totales: number | null;
    goles: number | null;
    asistencias: number | null;
    tarjetas_amarillas: number | null;
    tarjetas_rojas: number | null;
}

export interface Contrato {
    fin_contrato: string | null; // Año (YYYY) o fecha (YYYY-MM-DD)
    estado: 'Propiedad' | 'Cedido' | 'Libre' | null;
    agente: string | null;
    valor_mercado: number | null; // en euros
}

export interface Jugador {
    id_jugador: string; // Ej: diego-sanchez-1234
    nombre_completo: string;
    nombre_corto: string;
    puntuacion_elo: number | null;
    biometria: Biometria;
    club_actual: string | null;
    ultimo_club: string | null;
    competicion: string | null;
    posicion: 'POR' | 'LD' | 'LI' | 'DFC' | 'MCD' | 'MC' | 'MCO' | 'EI' | 'ED' | 'DC';
    posicion_detalle: string | null;
    posicion_secundaria?: 'POR' | 'LD' | 'LI' | 'DFC' | 'MCD' | 'MC' | 'MCO' | 'EI' | 'ED' | 'DC' | null;
    estadisticas: Estadisticas;
    contrato: Contrato;
    imagen_url: string | null;
    es_seguido?: boolean;
    es_sub23?: boolean;
}

// --- Gestión de Jugadores Propios (Plantilla UCAM CF) ---

export interface AccionesJugadorPropio {
    fin_contrato: string | null;    // DD/MM/AAAA
    salario: number | null;         // en euros/año
    prima_tipo: string | null;      // tipo de prima
    prima_cantidad: number | null;  // cantidad en euros
}

export interface NotaPrivada {
    id: string;
    fecha: string;                  // ISO timestamp
    contenido: string;
}

export interface JugadorPropio {
    id_jugador: string;
    nombre_completo: string;
    nombre_corto: string;
    equipo: 'UCAM CF';
    posicion: 'POR' | 'LD' | 'LI' | 'DFC' | 'MCD' | 'MC' | 'MCO' | 'EI' | 'ED' | 'DC';
    imagen_url: string | null;
    // Estadísticas de la tabla
    partidos_convocado: number | null;     // PC
    partidos_jugados: number | null;       // PJ
    partidos_titular: number | null;       // PT
    minutos: number | null;               // Min
    goles: number | null;                 // Gol
    asistencias: number | null;           // Asist.
    tarjetas_amarillas: number | null;
    tarjetas_rojas: number | null;
    ganados: number | null;               // G
    empatados: number | null;             // E
    perdidos: number | null;              // P
    valor_mercado: number | null;         // Val. Mercado
    salario: number | null;               // Salario
    // Datos extendidos
    acciones: AccionesJugadorPropio;
    notas_privadas: NotaPrivada[];
    edad?: number | null;
    es_sub23?: boolean;
}
