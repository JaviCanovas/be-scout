'use client';

import { useState, useMemo, useEffect } from 'react';
import { SidebarFilter } from '@/components/layout/SidebarFilter';
import { PlayerTable } from '@/components/layout/PlayerTable';
import { filterPlayers, FilterOptions } from '@/lib/scouting-engine';
import { supabase } from '@/lib/supabase';
import { Jugador } from '@/types';
import { ClipboardList } from 'lucide-react';

export default function JugadoresSeguidosPage() {
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
    marketValue: ['', '']
  });

  useEffect(() => {
    async function fetchFollowed() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('jugadores')
          .select('*')
          .eq('es_seguido', true)
          .order('nombre_corto', { ascending: true });

        if (error) throw error;

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
          es_sub23: row.es_sub23 ?? false,
        }));

        setAllPlayers(mapped);
      } catch (err) {
        console.error('[BeScout] Error cargando jugadores seguidos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFollowed();
  }, []);

  const filteredPlayers = useMemo(() => {
    return filterPlayers(allPlayers, filters);
  }, [allPlayers, filters]);

  const handleToggleFollow = async (id: string, currentlyFollowed: boolean) => {
    // Si quitamos la estrella desde "Jugadores Seguidos", el jugador desaparece de esta vista
    setAllPlayers(current => current.filter(p => p.id_jugador !== id));

    try {
      const { error } = await supabase
        .from('jugadores')
        .update({ es_seguido: !currentlyFollowed })
        .eq('id_jugador', id);

      if (error) throw error;
    } catch (err) {
      console.error('[BeScout] Error al dejar de seguir jugador:', err);
      // Opcional: Revertir si hay error (requeriría guardarlo o hacer re-fetch)
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 flex flex-col gap-6">

        <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-[var(--color-bescout-cyan)]" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Jugadores Seguidos</h1>
                <p className="text-zinc-400">Jugadores que tienes en seguimiento en la Base de Datos</p>
            </div>
        </div>

      <main className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <SidebarFilter filters={filters} setFilters={setFilters} />
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-zinc-900/80 border border-zinc-800" />
              ))}
            </div>
          ) : allPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
              <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Sin jugadores seguidos</p>
              <p className="text-sm mt-1">Marca jugadores con la estrella (⭐) desde la Base de Datos.</p>
            </div>
          ) : (
            <PlayerTable players={filteredPlayers} onToggleFollow={handleToggleFollow} />
          )}
        </div>

      </main>

    </div>
  );
}
