'use client';

import { useState, useMemo, useEffect } from 'react';
import { SidebarFilter } from '@/components/layout/SidebarFilter';
import { PlayerTable } from '@/components/layout/PlayerTable';
import { filterPlayers, FilterOptions } from '@/lib/scouting-engine';
import { supabase } from '@/lib/supabase';
import { Jugador } from '@/types';

export default function Home() {
  const [allPlayers, setAllPlayers] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    competition: [],
    club: null,
    positions: [],
    ageRange: ['', ''],
    onlyU23: false,
    minutesPlayed: ['', ''],
    marketValue: ['', ''],
    minRating: null
  });

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('jugadores')
          .select('*')
          .eq('es_propio', false)
          .order('nombre_corto', { ascending: true });

        if (error) throw error;

        // Mapear el esquema plano de Supabase al tipo Jugador anidado del frontend
        const mapped: Jugador[] = (data || []).map((row: any) => ({
          id_jugador: row.id_jugador,
          nombre_completo: row.nombre_completo,
          nombre_corto: row.nombre_corto,
          puntuacion_elo: row.puntuacion_elo ?? null,
          biometria: {
            edad: row.edad ?? null,
            peso: row.peso ?? null,
            altura: row.altura ?? null,
            pie_dominante: row.pie_dominante ?? null,
          },
          club_actual: row.equipo ?? null,
          ultimo_club: null,
          competicion: row.competicion ?? null,
          posicion: row.posicion ?? 'MC',
          posicion_detalle: null,
          posicion_secundaria: null,
          estadisticas: {
            partidos_jugados: row.partidos_jugados ?? null,
            partidos_titular: row.partidos_titular ?? null,
            minutos_totales: row.minutos ?? null,
            goles: row.goles ?? null,
            asistencias: row.asistencias ?? null,
            tarjetas_amarillas: row.tarjetas_amarillas ?? null,
            tarjetas_rojas: row.tarjetas_rojas ?? null,
          },
          contrato: {
            fin_contrato: row.fin_contrato ?? null,
            estado: 'Propiedad',
            agente: null,
            valor_mercado: row.valor_mercado ?? null,
          },
          imagen_url: row.imagen_url ?? null,
          es_seguido: row.es_seguido ?? false,
          es_propio: row.es_propio ?? false,
          valoracion_estrellas: row.valoracion_estrellas ?? 0,
          informe_pdf_url: row.informe_pdf_url ?? null,
          video_url: row.video_url ?? null,
        }));

        setAllPlayers(mapped);
      } catch (err) {
        console.error('[BeScout] Error cargando jugadores desde Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    return filterPlayers(allPlayers, filters);
  }, [allPlayers, filters]);

  const handleToggleFollow = async (id: string, currentlyFollowed: boolean) => {
    // Optimistic UI update
    setAllPlayers(current => 
      current.map(p => p.id_jugador === id ? { ...p, es_seguido: !currentlyFollowed } : p)
    );

    try {
      const { error } = await supabase
        .from('jugadores')
        .update({ es_seguido: !currentlyFollowed })
        .eq('id_jugador', id);

      if (error) throw error;
    } catch (err) {
      console.error('[BeScout] Error al seguir jugador:', err);
      // Revert optimistic update on error
      setAllPlayers(current => 
        current.map(p => p.id_jugador === id ? { ...p, es_seguido: currentlyFollowed } : p)
      );
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 flex flex-col gap-6">

      <main className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <SidebarFilter filters={filters} setFilters={setFilters} />
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-zinc-900/80 border border-zinc-800" />
              ))}
            </div>
          ) : (
            <PlayerTable players={filteredPlayers} onToggleFollow={handleToggleFollow} />
          )}
        </div>

      </main>

    </div>
  );
}
