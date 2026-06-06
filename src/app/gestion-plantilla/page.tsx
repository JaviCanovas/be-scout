'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { SquadTable } from '@/components/squad/SquadTable';
import { PlayerNotesPanel } from '@/components/squad/PlayerNotesPanel';
import { JugadorPropio } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function GestionPlantillaPage() {
    const [players, setPlayers] = useState<JugadorPropio[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayerForNotes, setSelectedPlayerForNotes] = useState<JugadorPropio | null>(null);

    // Cargar jugadores propios desde Supabase
    useEffect(() => {
        async function fetchSquad() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('jugadores')
                    .select('*')
                    .eq('es_propio', true)
                    .order('posicion', { ascending: true });

                if (error) throw error;

                // Cargar notas privadas para cada jugador
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

                // Orden deseado de posiciones (Portero a Delantero)
                const positionOrder: Record<string, number> = {
                    'POR': 1,
                    'LD': 2,
                    'DFC': 3,
                    'LI': 4,
                    'MCD': 5,
                    'MC': 6,
                    'MCO': 7,
                    'ED': 8,
                    'EI': 9,
                    'DC': 10
                };

                // Mapear esquema plano de Supabase a JugadorPropio y ordenar
                const mapped: JugadorPropio[] = (data || []).map((row: any) => ({
                    id_jugador: row.id_jugador,
                    nombre_completo: row.nombre_completo,
                    nombre_corto: row.nombre_corto,
                    equipo: 'UCAM CF' as const,
                    posicion: row.posicion ?? 'MC',
                    imagen_url: row.imagen_url ?? null,
                    partidos_convocado: row.partidos_convocado ?? null,
                    partidos_jugados: row.partidos_jugados ?? null,
                    partidos_titular: row.partidos_titular ?? null,
                    minutos: row.minutos ?? null,
                    goles: row.goles ?? null,
                    asistencias: row.asistencias ?? null,
                    tarjetas_amarillas: row.tarjetas_amarillas ?? null,
                    tarjetas_rojas: row.tarjetas_rojas ?? null,
                    ganados: row.ganados ?? null,
                    empatados: row.empatados ?? null,
                    perdidos: row.perdidos ?? null,
                    valor_mercado: row.valor_mercado ?? null,
                    salario: row.salario ?? null,
                    acciones: {
                        fin_contrato: row.fin_contrato ?? null,
                        salario: row.salario ?? null,
                        prima_tipo: row.prima_tipo ?? null,
                        prima_cantidad: row.prima_cantidad ?? null,
                    },
                    notas_privadas: notasPorJugador[row.id_jugador] || [],
                    edad: row.edad ?? null,
                    es_sub23: row.es_sub23 ?? false,
                })).sort((a, b) => (positionOrder[a.posicion] || 99) - (positionOrder[b.posicion] || 99));

                setPlayers(mapped);
            } catch (err) {
                console.error('[BeScout] Error cargando plantilla desde Supabase:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchSquad();
    }, []);

    // Derived stats
    const totalPlayers = players.length;
    const totalValue = players.reduce((sum, p) => sum + (p.valor_mercado || 0), 0);
    const totalSalary = players.reduce((sum, p) => sum + (p.salario || 0), 0);
    const totalGoals = players.reduce((sum, p) => sum + (p.goles || 0), 0);

    const handleUpdatePlayer = async (id: string, updates: any) => {
        // Actualizar estado local inmediatamente
        setPlayers(current => current.map(p => {
            if (p.id_jugador === id) {
                return {
                    ...p,
                    ...updates,
                    acciones: {
                        ...p.acciones,
                        fin_contrato: updates.fin_contrato !== undefined ? updates.fin_contrato : p.acciones?.fin_contrato,
                        salario: updates.salario !== undefined ? updates.salario : p.acciones?.salario,
                        prima_tipo: updates.prima_tipo !== undefined ? updates.prima_tipo : p.acciones?.prima_tipo,
                        prima_cantidad: updates.prima_cantidad !== undefined ? updates.prima_cantidad : p.acciones?.prima_cantidad,
                    }
                };
            }
            return p;
        }));

        // Preparar objeto para base de datos (sin el virtual 'acciones')
        const dbUpdates = { ...updates };
        delete dbUpdates.acciones;

        if (Object.keys(dbUpdates).length === 0) return;

        // Persistir en Supabase
        try {
            const { error } = await supabase
                .from('jugadores')
                .update(dbUpdates)
                .eq('id_jugador', id);

            if (error) throw error;
        } catch (err) {
            console.error('[BeScout] Error actualizando jugador en Supabase:', err);
        }
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

            handleUpdatePlayer(selectedPlayerForNotes.id_jugador, {
                notas_privadas: [
                    ...(selectedPlayerForNotes.notas_privadas || []),
                    newNote
                ]
            });

            setSelectedPlayerForNotes({
                ...selectedPlayerForNotes,
                notas_privadas: [...(selectedPlayerForNotes.notas_privadas || []), newNote]
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
            handleUpdatePlayer(selectedPlayerForNotes.id_jugador, { notas_privadas: updatedNotes });
            setSelectedPlayerForNotes({
                ...selectedPlayerForNotes,
                notas_privadas: updatedNotes
            });
        } catch (err) {
            console.error('[BeScout] Error eliminando nota:', err);
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-8 flex flex-col gap-6">
            
            {/* Header & KPI Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center p-2">
                        <Shield className="w-10 h-10 text-[var(--color-bescout-gold)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Plantilla</h1>
                        <p className="text-zinc-400">UCAM Murcia CF — Segunda RFEF Grupo 4</p>
                    </div>
                </div>

                <div className="flex gap-4 flex-wrap">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 min-w-[120px]">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Plantilla</p>
                        <p className="text-xl font-bold text-white">{totalPlayers} <span className="text-sm font-normal text-zinc-500">jugadores</span></p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 min-w-[140px]">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Goles Totales</p>
                        <p className="text-xl font-bold text-white">{totalGoals} <span className="text-sm font-normal text-zinc-500">goles</span></p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 min-w-[140px]">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Valor Total</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(totalValue)}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 min-w-[140px]">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Masa Salarial</p>
                        <p className="text-xl font-bold text-white">
                            {totalSalary > 0 ? `€${(totalSalary / 1000).toFixed(1)}k` : '-'}
                            <span className="text-sm font-normal text-zinc-500"> /año</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Squad Table */}
            <main>
                {loading ? (
                    <div className="flex flex-col gap-2 animate-pulse">
                        <div className="h-10 rounded-lg bg-zinc-900/80 border border-zinc-800 mb-2" />
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-14 rounded-lg bg-zinc-900/60 border border-zinc-800" />
                        ))}
                    </div>
                ) : players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                        <Shield className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Sin jugadores en la plantilla</p>
                        <p className="text-sm mt-1">Ejecuta el scraper de UCAM CF para poblar la base de datos.</p>
                    </div>
                ) : (
                    <SquadTable 
                        players={players} 
                        onOpenNotes={setSelectedPlayerForNotes} 
                        onUpdatePlayer={handleUpdatePlayer} 
                    />
                )}
            </main>

            {/* Notes Slide-in Panel */}
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
