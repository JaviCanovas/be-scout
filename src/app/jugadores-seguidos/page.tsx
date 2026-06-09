'use client';

import { useState, useMemo, useEffect } from 'react';
import { SidebarFilter } from '@/components/layout/SidebarFilter';
import { PlayerTable } from '@/components/layout/PlayerTable';
import { PlayerNotesPanel } from '@/components/squad/PlayerNotesPanel';
import { PlayerCard } from '@/components/player/PlayerCard';
import { filterPlayers, FilterOptions } from '@/lib/scouting-engine';
import { supabase } from '@/lib/supabase';
import { Jugador } from '@/types';
import { ClipboardList, LayoutGrid, List } from 'lucide-react';

export default function JugadoresSeguidosPage() {
  const [allPlayers, setAllPlayers] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerForNotes, setSelectedPlayerForNotes] = useState<Jugador | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

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
    async function fetchFollowed() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('jugadores')
          .select('*')
          .eq('es_seguido', true)
          .order('nombre_corto', { ascending: true });

        if (error) throw error;

        const jugadorIds = (data || []).map((p: any) => p.id_jugador);
        let notasPorJugador: Record<string, any[]> = {};

        if (jugadorIds.length > 0) {
            const { data: notasData } = await supabase
                .from('notas_privadas')
                .select('*')
                .in('id_jugador', jugadorIds)
                .order('fecha', { ascending: false });

            (notasData || []).forEach((nota: any) => {
                if (!notasPorJugador[nota.id_jugador]) {
                    notasPorJugador[nota.id_jugador] = [];
                }
                notasPorJugador[nota.id_jugador].push({
                    id: nota.id,
                    fecha: nota.fecha,
                    contenido: nota.contenido,
                });
            });
        }

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
          es_propio: row.es_propio ?? false,
          notas_privadas: notasPorJugador[row.id_jugador] || [],
          valoracion_estrellas: row.valoracion_estrellas ?? 0,
          informe_pdf_url: row.informe_pdf_url ?? null,
          video_url: row.video_url ?? null,
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
    }
  };

  const handleUpdateRating = async (id: string, rating: number) => {
    // Optimistic UI update
    setAllPlayers(current => current.map(p => p.id_jugador === id ? { ...p, valoracion_estrellas: rating } : p));
    
    try {
      const { error } = await supabase
        .from('jugadores')
        .update({ valoracion_estrellas: rating })
        .eq('id_jugador', id);

      if (error) throw error;
    } catch (err) {
      console.error('[BeScout] Error actualizando valoración en Supabase:', err);
    }
  };

  const handleUploadImage = async (id: string, base64: string) => {
    // Optimistic UI update
    setAllPlayers(current => current.map(p => p.id_jugador === id ? { ...p, imagen_url: base64 } : p));
    
    try {
      const { error } = await supabase
        .from('jugadores')
        .update({ imagen_url: base64 })
        .eq('id_jugador', id);

      if (error) throw error;
    } catch (err) {
      console.error('[BeScout] Error subiendo imagen de jugador a Supabase:', err);
    }
  };

  const handleUploadPdf = async (id: string, base64: string) => {
    // Optimistic UI update
    setAllPlayers(current => current.map(p => p.id_jugador === id ? { ...p, informe_pdf_url: base64 } : p));
    
    try {
      const { error } = await supabase
        .from('jugadores')
        .update({ informe_pdf_url: base64 })
        .eq('id_jugador', id);

      if (error) throw error;
    } catch (err) {
      console.error('[BeScout] Error subiendo informe PDF a Supabase:', err);
    }
  };

  const handleDeletePdf = async (id: string) => {
    // Optimistic UI update
    setAllPlayers(current => current.map(p => p.id_jugador === id ? { ...p, informe_pdf_url: null } : p));
    
    try {
      const { error } = await supabase
        .from('jugadores')
        .update({ informe_pdf_url: null })
        .eq('id_jugador', id);

      if (error) throw error;
    } catch (err) {
      console.error('[BeScout] Error eliminando informe PDF de Supabase:', err);
    }
  };

  const handleUpdateVideoUrl = async (id: string, url: string | null) => {
    // Optimistic UI update
    setAllPlayers(current => current.map(p => p.id_jugador === id ? { ...p, video_url: url } : p));
    
    try {
      const { error } = await supabase
        .from('jugadores')
        .update({ video_url: url })
        .eq('id_jugador', id);

      if (error) throw error;
    } catch (err) {
      console.error('[BeScout] Error actualizando URL de video en Supabase:', err);
    }
  };

  const handleUpdatePlayerNotes = (id: string, updatedNotes: any[]) => {
      setAllPlayers(current => current.map(p => {
          if (p.id_jugador === id) {
              return { ...p, notas_privadas: updatedNotes };
          }
          return p;
      }));
  };

  const handleSaveNote = async (content: string) => {
      if (!selectedPlayerForNotes) return;

      const newNota = {
          id_jugador: selectedPlayerForNotes.id_jugador,
          contenido: content,
      };

      try {
          const { data, error } = await supabase
              .from('notas_privadas')
              .insert(newNota)
              .select()
              .single();

          if (error) throw error;

          const newNote = {
              id: data.id,
              fecha: data.fecha,
              contenido: data.contenido,
          };

          const updatedNotes = [...(selectedPlayerForNotes.notas_privadas || []), newNote];
          
          handleUpdatePlayerNotes(selectedPlayerForNotes.id_jugador, updatedNotes);

          setSelectedPlayerForNotes({
              ...selectedPlayerForNotes,
              notas_privadas: updatedNotes
          });
      } catch (err) {
          console.error('[BeScout] Error guardando nota:', err);
      }
  };

  const handleDeleteNote = async (noteId: string) => {
      if (!selectedPlayerForNotes) return;

      try {
          const { error } = await supabase
              .from('notas_privadas')
              .delete()
              .eq('id', noteId);

          if (error) throw error;

          const updatedNotes = (selectedPlayerForNotes.notas_privadas || []).filter(n => n.id !== noteId);
          handleUpdatePlayerNotes(selectedPlayerForNotes.id_jugador, updatedNotes);
          setSelectedPlayerForNotes({
              ...selectedPlayerForNotes,
              notas_privadas: updatedNotes
          });
      } catch (err) {
          console.error('[BeScout] Error eliminando nota:', err);
      }
  };

  // Derived KPIs
  const kpis = useMemo(() => {
    const total = allPlayers.length;
    
    // Avg Rating
    const ratedPlayers = allPlayers.filter(p => p.valoracion_estrellas && p.valoracion_estrellas > 0);
    const avgRating = ratedPlayers.length > 0 
      ? (ratedPlayers.reduce((sum, p) => sum + (p.valoracion_estrellas || 0), 0) / ratedPlayers.length).toFixed(1)
      : '-';

    // Avg Age
    const playersWithAge = allPlayers.filter(p => p.biometria.edad !== null && p.biometria.edad !== undefined);
    const avgAge = playersWithAge.length > 0
      ? (playersWithAge.reduce((sum, p) => sum + (p.biometria.edad || 0), 0) / playersWithAge.length).toFixed(1)
      : '-';

    // Unique Clubs
    const uniqueClubs = new Set(allPlayers.map(p => p.club_actual).filter(Boolean)).size;

    // Leader and Weak positions
    const allPositions = ['POR', 'LD', 'LI', 'DFC', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'];
    const positionCounts: Record<string, number> = {};
    allPositions.forEach(pos => { positionCounts[pos] = 0; });
    allPlayers.forEach(p => {
      if (p.posicion && allPositions.includes(p.posicion)) {
        positionCounts[p.posicion]++;
      }
    });

    let leaderPos = '-';
    let maxCount = 0;
    let weakPos = '-';
    let minCount = total > 0 ? Infinity : 0;

    Object.entries(positionCounts).forEach(([pos, count]) => {
      if (count > maxCount) {
        maxCount = count;
        leaderPos = pos;
      }
      if (total > 0 && count < minCount) {
        minCount = count;
        weakPos = pos;
      }
    });

    return {
      total,
      avgRating,
      avgAge,
      uniqueClubs,
      leaderPos: maxCount > 0 ? `${leaderPos} (${maxCount})` : '-',
      weakPos: minCount !== Infinity && minCount !== 0 ? `${weakPos} (${minCount})` : '-'
    };
  }, [allPlayers]);

  return (
    <div className="min-h-screen p-6 md:p-8 flex flex-col gap-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-[var(--color-bescout-cyan)]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Jugadores Seguidos</h1>
                    <p className="text-zinc-400">Jugadores que tienes en seguimiento en la Base de Datos</p>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 self-start sm:self-center shrink-0">
                <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-[var(--color-bescout-cyan)]/10 text-[var(--color-bescout-cyan)] border border-[var(--color-bescout-cyan)]/25 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Tarjetas
                </button>
                <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${viewMode === 'table' ? 'bg-[var(--color-bescout-cyan)]/10 text-[var(--color-bescout-cyan)] border border-[var(--color-bescout-cyan)]/25 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <List className="w-3.5 h-3.5" />
                    Lista
                </button>
            </div>
        </div>

        {/* KPI Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-2">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Seguidos Totales</p>
                <p className="text-xl font-bold text-white">
                    {kpis.total} <span className="text-xs font-normal text-zinc-500">jugadores</span>
                </p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Valoración Media</p>
                <p className="text-xl font-bold text-[var(--color-bescout-gold)] flex items-center gap-1">
                    {kpis.avgRating} {kpis.avgRating !== '-' && <span className="text-xs font-normal text-zinc-400">★</span>}
                </p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Edad Promedio</p>
                <p className="text-xl font-bold text-white">
                    {kpis.avgAge} {kpis.avgAge !== '-' && <span className="text-xs font-normal text-zinc-500">años</span>}
                </p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Clubes Distintos</p>
                <p className="text-xl font-bold text-white">
                    {kpis.uniqueClubs} <span className="text-xs font-normal text-zinc-500">clubes</span>
                </p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Posición Líder</p>
                <p className="text-xl font-bold text-[var(--color-bescout-cyan)] truncate">
                    {kpis.leaderPos}
                </p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 shadow-md">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Posición Débil</p>
                <p className="text-xl font-bold text-red-400 truncate">
                    {kpis.weakPos}
                </p>
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
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id_jugador}
                  player={player}
                  onToggleFollow={handleToggleFollow}
                  onOpenNotes={setSelectedPlayerForNotes}
                  onUpdateRating={handleUpdateRating}
                  onUploadImage={handleUploadImage}
                  onUploadPdf={handleUploadPdf}
                  onDeletePdf={handleDeletePdf}
                  onUpdateVideoUrl={handleUpdateVideoUrl}
                />
              ))}
              {filteredPlayers.length === 0 && (
                <div className="col-span-full py-16 text-center text-zinc-500 bg-[#1c2025]/50 rounded-xl border border-zinc-800/80">
                  No se encontraron jugadores que coincidan con los filtros.
                </div>
              )}
            </div>
          ) : (
            <PlayerTable 
                players={filteredPlayers} 
                onToggleFollow={handleToggleFollow} 
                onOpenNotes={setSelectedPlayerForNotes}
            />
          )}
        </div>

      </main>

      <PlayerNotesPanel 
          isOpen={!!selectedPlayerForNotes}
          onClose={() => setSelectedPlayerForNotes(null)}
          playerName={selectedPlayerForNotes?.nombre_completo || ''}
          notes={selectedPlayerForNotes?.notas_privadas || []}
          onSaveNote={handleSaveNote}
          onDeleteNote={handleDeleteNote}
      />
    </div>
  );
}
