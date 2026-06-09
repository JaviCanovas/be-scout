'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Jugador } from '@/types';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Badge';
import { cn, getLocalStorage, setLocalStorage } from '@/lib/utils';
import { 
    LayoutGrid, 
    Trash2, 
    AlertTriangle,
    RotateCcw,
    Users,
    ChevronRight,
    Map
} from 'lucide-react';

// Formations layout positions coordinates (x, y representation in percent)
interface PositionCoords {
    label: string;
    top: string;
    left: string;
}

type FormationType = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';

const FORMATIONS: Record<FormationType, Record<string, PositionCoords>> = {
    '4-3-3': {
        'POR': { label: 'POR', top: '88%', left: '50%' },
        'LI': { label: 'LI', top: '70%', left: '15%' },
        'DFC_IZQ': { label: 'DFC Izq', top: '74%', left: '37%' },
        'DFC_DER': { label: 'DFC Der', top: '74%', left: '63%' },
        'LD': { label: 'LD', top: '70%', left: '85%' },
        'MC_IZQ': { label: 'MC Izq', top: '50%', left: '26%' },
        'MCD': { label: 'MCD', top: '56%', left: '50%' },
        'MC_DER': { label: 'MC Der', top: '50%', left: '74%' },
        'EI': { label: 'EI', top: '24%', left: '18%' },
        'DC': { label: 'DC', top: '18%', left: '50%' },
        'ED': { label: 'ED', top: '24%', left: '82%' }
    },
    '4-4-2': {
        'POR': { label: 'POR', top: '88%', left: '50%' },
        'LI': { label: 'LI', top: '70%', left: '15%' },
        'DFC_IZQ': { label: 'DFC Izq', top: '74%', left: '37%' },
        'DFC_DER': { label: 'DFC Der', top: '74%', left: '63%' },
        'LD': { label: 'LD', top: '70%', left: '85%' },
        'EI': { label: 'EI', top: '48%', left: '16%' },
        'MC_IZQ': { label: 'MC Izq', top: '52%', left: '38%' },
        'MC_DER': { label: 'MC Der', top: '52%', left: '62%' },
        'ED': { label: 'ED', top: '48%', left: '84%' },
        'DC_IZQ': { label: 'DC Izq', top: '22%', left: '35%' },
        'DC_DER': { label: 'DC Der', top: '22%', left: '65%' }
    },
    '3-5-2': {
        'POR': { label: 'POR', top: '88%', left: '50%' },
        'DFC_IZQ': { label: 'DFC Izq', top: '74%', left: '25%' },
        'DFC_CEN': { label: 'DFC Cen', top: '76%', left: '50%' },
        'DFC_DER': { label: 'DFC Der', top: '74%', left: '75%' },
        'LI': { label: 'LI', top: '52%', left: '12%' },
        'MCD_IZQ': { label: 'MCD Izq', top: '56%', left: '34%' },
        'MCD_DER': { label: 'MCD Der', top: '56%', left: '66%' },
        'LD': { label: 'LD', top: '52%', left: '88%' },
        'MCO': { label: 'MCO', top: '38%', left: '50%' },
        'DC_IZQ': { label: 'DC Izq', top: '20%', left: '35%' },
        'DC_DER': { label: 'DC Der', top: '20%', left: '65%' }
    },
    '4-2-3-1': {
        'POR': { label: 'POR', top: '88%', left: '50%' },
        'LI': { label: 'LI', top: '70%', left: '15%' },
        'DFC_IZQ': { label: 'DFC Izq', top: '74%', left: '37%' },
        'DFC_DER': { label: 'DFC Der', top: '74%', left: '63%' },
        'LD': { label: 'LD', top: '70%', left: '85%' },
        'MCD_IZQ': { label: 'MCD Izq', top: '56%', left: '35%' },
        'MCD_DER': { label: 'MCD Der', top: '56%', left: '65%' },
        'EI': { label: 'EI', top: '35%', left: '15%' },
        'MCO': { label: 'MCO', top: '38%', left: '50%' },
        'ED': { label: 'ED', top: '35%', left: '85%' },
        'DC': { label: 'DC', top: '18%', left: '50%' }
    }
};

type BoardLayout = Record<string, string[]>; // PositionKey -> PlayerIds[]

export default function CampogramaPage() {
    const [allPlayers, setAllPlayers] = useState<Jugador[]>([]);
    const [loading, setLoading] = useState(true);
    const [formation, setFormation] = useState<FormationType>('4-3-3');
    const [activeTab, setActiveTab] = useState<'seguidos' | 'propios'>('seguidos');
    
    // Board layouts for each formation
    const [boardLayout, setBoardLayout] = useState<BoardLayout>({});
    
    const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
    const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Load players from Supabase (both seguidos and propios)
    useEffect(() => {
        async function fetchPlayers() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('jugadores')
                    .select('*')
                    .or('es_seguido.eq.true,es_propio.eq.true')
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
                    es_propio: row.es_propio ?? false,
                    valoracion_estrellas: row.valoracion_estrellas ?? 0,
                    informe_pdf_url: row.informe_pdf_url ?? null,
                    video_url: row.video_url ?? null,
                }));

                setAllPlayers(mapped);
            } catch (err) {
                console.error('[BeScout] Error al cargar jugadores:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPlayers();
    }, []);

    // Load saved layout from localstorage when formation changes
    useEffect(() => {
        const key = `bescout-squad-layout-${formation}`;
        const saved = getLocalStorage<BoardLayout>(key);
        if (saved) {
            setBoardLayout(saved);
        } else {
            // Initialize empty positions
            const initial: BoardLayout = {};
            Object.keys(FORMATIONS[formation]).forEach(pos => {
                initial[pos] = [];
            });
            setBoardLayout(initial);
        }
    }, [formation]);

    // Save layout to localstorage
    const saveLayout = (newLayout: BoardLayout) => {
        setBoardLayout(newLayout);
        const key = `bescout-squad-layout-${formation}`;
        setLocalStorage(key, newLayout);
    };

    // Show transient error message
    const showError = (msg: string) => {
        setErrorMsg(msg);
        setTimeout(() => {
            setErrorMsg(null);
        }, 3000);
    };

    // Derived lists
    const followedPlayersList = useMemo(() => allPlayers.filter(p => p.es_seguido), [allPlayers]);
    const ownPlayersList = useMemo(() => allPlayers.filter(p => p.es_propio), [allPlayers]);

    const displayedPlayers = useMemo(() => {
        return activeTab === 'seguidos' ? followedPlayersList : ownPlayersList;
    }, [activeTab, followedPlayersList, ownPlayersList]);

    // Filter out players already positioned on the board to avoid clutter
    const positionedPlayerIds = useMemo(() => {
        return Object.values(boardLayout).flat();
    }, [boardLayout]);

    const handleDragStart = (playerId: string) => {
        setDraggedPlayerId(playerId);
    };

    const handleDrop = (e: React.DragEvent, targetPosition: string) => {
        e.preventDefault();
        setDragOverSlot(null);

        const playerId = draggedPlayerId || e.dataTransfer.getData('playerId');
        if (!playerId) return;

        // Check if player is already in this slot
        const currentInSlot = boardLayout[targetPosition] || [];
        if (currentInSlot.includes(playerId)) {
            return;
        }

        // Limit check: max 3 per position
        if (currentInSlot.length >= 3) {
            showError(`Límite alcanzado: Máximo 3 jugadores por posición (${FORMATIONS[formation][targetPosition]?.label}).`);
            return;
        }

        // Remove player from any existing positions on the board (movement)
        const updatedLayout = { ...boardLayout };
        Object.keys(updatedLayout).forEach(pos => {
            updatedLayout[pos] = (updatedLayout[pos] || []).filter(id => id !== playerId);
        });

        // Add player to new position
        updatedLayout[targetPosition] = [...(updatedLayout[targetPosition] || []), playerId];
        
        saveLayout(updatedLayout);
        setDraggedPlayerId(null);
    };

    const handleRemovePlayer = (position: string, playerId: string) => {
        const updatedLayout = { ...boardLayout };
        updatedLayout[position] = (updatedLayout[position] || []).filter(id => id !== playerId);
        saveLayout(updatedLayout);
    };

    const handleClearField = () => {
        if (!confirm('¿Estás seguro de que quieres limpiar la pizarra táctica?')) return;
        const cleared: BoardLayout = {};
        Object.keys(FORMATIONS[formation]).forEach(pos => {
            cleared[pos] = [];
        });
        saveLayout(cleared);
    };

    // Maps player ID list to Player objects
    const getPlayersInPosition = (position: string): Jugador[] => {
        const ids = boardLayout[position] || [];
        return ids
            .map(id => allPlayers.find(p => p.id_jugador === id))
            .filter((p): p is Jugador => !!p);
    };

    return (
        <div className="min-h-screen p-6 md:p-8 flex flex-col gap-6">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center">
                        <Map className="w-6 h-6 text-[var(--color-bescout-cyan)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Campograma Táctico</h1>
                        <p className="text-zinc-400">Pizarra interactiva de alineación y análisis para planificar las siguientes temporadas</p>
                    </div>
                </div>

                {/* Clean field button */}
                <button
                    onClick={handleClearField}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 hover:border-red-500/35 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                >
                    <RotateCcw className="w-4 h-4" />
                    Limpiar Campo
                </button>
            </div>

            {/* Error banner */}
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 animate-bounce shadow-lg">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{errorMsg}</span>
                </div>
            )}

            <main className="flex flex-col xl:flex-row gap-6">

                {/* Left Side Panel: Draggable Players List */}
                <div className="w-full xl:w-80 shrink-0 bg-[#1c2025] border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4 max-h-[720px] overflow-hidden shadow-xl">
                    <div>
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Jugadores Disponibles</h2>
                        <p className="text-xs text-zinc-500 mt-1">Arrastra jugadores al campo de fútbol</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800/80">
                        <button
                            onClick={() => setActiveTab('seguidos')}
                            className={cn(
                                "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                                activeTab === 'seguidos'
                                    ? "bg-zinc-800 text-white border border-zinc-700/30 shadow-md"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            Seguidos ({followedPlayersList.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('propios')}
                            className={cn(
                                "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                                activeTab === 'propios'
                                    ? "bg-zinc-800 text-white border border-zinc-700/30 shadow-md"
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            Propios ({ownPlayersList.length})
                        </button>
                    </div>

                    {/* Draggable items list */}
                    <div className="overflow-y-auto pr-1 flex flex-col gap-2 flex-1">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="h-14 rounded-lg bg-zinc-900/60 border border-zinc-800/40 animate-pulse" />
                            ))
                        ) : displayedPlayers.length === 0 ? (
                            <div className="text-center py-12 text-zinc-600 flex flex-col items-center justify-center gap-2">
                                <Users className="w-8 h-8 opacity-30" />
                                <p className="text-xs font-semibold">
                                    {activeTab === 'seguidos' ? 'Sin jugadores seguidos' : 'Sin jugadores propios'}
                                </p>
                                <p className="text-[10px]">
                                    {activeTab === 'seguidos' 
                                        ? 'Agrega jugadores en la BD general.' 
                                        : 'Asegúrate de tener cargada tu plantilla.'}
                                </p>
                            </div>
                        ) : (
                            displayedPlayers.map(player => {
                                const isOnField = positionedPlayerIds.includes(player.id_jugador);
                                return (
                                    <div
                                        key={player.id_jugador}
                                        draggable
                                        onDragStart={(e) => {
                                            handleDragStart(player.id_jugador);
                                            e.dataTransfer.setData('playerId', player.id_jugador);
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-grab active:cursor-grabbing transition-all select-none group relative",
                                            isOnField ? "opacity-50 border-dashed hover:border-zinc-800" : ""
                                        )}
                                    >
                                        {/* Avatar */}
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-800 bg-zinc-950">
                                            <SafeImage src={player.imagen_url} alt={player.nombre_corto} fallbackType="player" fill />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-xs text-white truncate block group-hover:text-[var(--color-bescout-cyan)] transition-colors">
                                                    {player.nombre_corto}
                                                </span>
                                                {isOnField && (
                                                    <span className="text-[9px] text-[var(--color-bescout-cyan)] bg-[var(--color-bescout-cyan)]/10 px-1 py-0.5 rounded font-medium border border-[var(--color-bescout-cyan)]/20">
                                                        En Campo
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant={player.posicion.toLowerCase() as any}>{player.posicion}</Badge>
                                                {activeTab === 'seguidos' && (
                                                    <span className="text-[10px] text-zinc-500 font-medium truncate block max-w-[100px]">
                                                        {player.club_actual || 'Sin club'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Side: Soccer field layout board */}
                <div className="flex-1 bg-[#1c2025] border border-zinc-800/80 rounded-xl p-6 flex flex-col gap-6">
                    
                    {/* Controls row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-zinc-400">Esquema:</label>
                            <div className="flex bg-zinc-950/80 rounded-lg p-0.5 border border-zinc-800">
                                {(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'] as FormationType[]).map((form) => (
                                    <button
                                        key={form}
                                        onClick={() => setFormation(form)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                                            formation === form 
                                                ? "bg-[var(--color-bescout-cyan)]/10 text-[var(--color-bescout-cyan)] border border-[var(--color-bescout-cyan)]/25" 
                                                : "text-zinc-400 hover:text-zinc-200"
                                        )}
                                    >
                                        {form}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-bescout-cyan)]" />
                            Arrastra y suelta hasta 3 jugadores por posición
                        </div>
                    </div>

                    {/* Soccer Pitch container */}
                    <div className="relative w-full h-[620px] bg-emerald-950/20 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-2xl">
                        
                        {/* Soccer Field markings */}
                        <div className="absolute inset-4 border border-emerald-800/20 rounded-lg pointer-events-none" />
                        
                        {/* Center Circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-emerald-800/15 rounded-full pointer-events-none" />
                        
                        {/* Center Spot */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-800/30 rounded-full pointer-events-none" />
                        
                        {/* Halfway Line */}
                        <div className="absolute top-1/2 left-4 right-4 h-px bg-emerald-800/15 pointer-events-none" />
                        
                        {/* Penalty Areas */}
                        {/* Top (Attack) */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[50%] h-[15%] border border-t-0 border-emerald-800/15 pointer-events-none" />
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[22%] h-[5%] border border-t-0 border-emerald-800/15 pointer-events-none" />
                        
                        {/* Bottom (Defense) */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[50%] h-[15%] border border-b-0 border-emerald-800/15 pointer-events-none" />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[22%] h-[5%] border border-b-0 border-emerald-800/15 pointer-events-none" />

                        {/* Interactive Position Nodes */}
                        {Object.entries(FORMATIONS[formation]).map(([slotId, pos]) => {
                            const isOver = dragOverSlot === slotId;
                            const slotPlayers = getPlayersInPosition(slotId);

                            return (
                                <div
                                    key={slotId}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverSlot(slotId);
                                    }}
                                    onDragLeave={() => setDragOverSlot(null)}
                                    onDrop={(e) => handleDrop(e, slotId)}
                                    className={cn(
                                        "absolute -translate-x-1/2 -translate-y-1/2 w-32 flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 z-10 shadow-lg",
                                        isOver
                                            ? "bg-[var(--color-bescout-cyan)]/25 border-[var(--color-bescout-cyan)] scale-105 shadow-[var(--color-bescout-cyan)]/20"
                                            : "bg-zinc-950/85 border-zinc-800/80 hover:bg-zinc-950 hover:border-zinc-700"
                                    )}
                                    style={{ top: pos.top, left: pos.left }}
                                >
                                    <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1.5">
                                        {pos.label}
                                    </span>

                                    {/* Positioned players list */}
                                    <div className="flex flex-col gap-1 w-full">
                                        {slotPlayers.map(player => (
                                            <div
                                                key={player.id_jugador}
                                                className={cn(
                                                    "flex items-center justify-between gap-1 border rounded px-2 py-1 text-[11px] hover:border-zinc-700 transition-colors",
                                                    player.es_propio 
                                                        ? "bg-amber-950/30 border-amber-900/45 text-amber-100" 
                                                        : "bg-zinc-900 border-zinc-800 text-white"
                                                )}
                                            >
                                                <span className="truncate flex-1 font-semibold" title={player.nombre_completo}>
                                                    {player.nombre_corto}
                                                </span>
                                                <button
                                                    onClick={() => handleRemovePlayer(slotId, player.id_jugador)}
                                                    className="text-zinc-500 hover:text-red-400 cursor-pointer p-0.5 leading-none transition-colors"
                                                    title="Quitar jugador"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}

                                        {/* Dropzone empty state indicator */}
                                        {slotPlayers.length === 0 && (
                                            <div className="text-[10px] text-zinc-700 text-center py-2.5 border border-dashed border-zinc-800 rounded-lg select-none">
                                                Arrastrar
                                            </div>
                                        )}

                                        {/* Counter visual slot indicators if players are loaded */}
                                        {slotPlayers.length > 0 && slotPlayers.length < 3 && (
                                            <div className="text-[8px] text-zinc-600 text-center border border-dashed border-zinc-800/50 rounded py-0.5 mt-0.5 select-none">
                                                + Añadir ({slotPlayers.length}/3)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </div>

            </main>

        </div>
    );
}
