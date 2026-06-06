'use client';

import { useState } from 'react';
import { JugadorPropio, NotaPrivada } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatSalary, formatCurrency } from '@/lib/utils';
import { ClipboardList, Save, X, Edit2 } from 'lucide-react';

interface SquadTableProps {
    players: JugadorPropio[];
    onOpenNotes: (player: JugadorPropio) => void;
    onUpdatePlayer: (id: string, updates: any) => void;
}

export function SquadTable({ players, onOpenNotes, onUpdatePlayer }: SquadTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{
        salario: number | '';
        fin_contrato: string;
        prima_tipo: string;
        prima_cantidad: number | '';
    } | null>(null);

    const startEditing = (player: JugadorPropio) => {
        setEditingId(player.id_jugador);
        setEditData({
            salario: player.salario ?? '',
            fin_contrato: player.acciones?.fin_contrato ?? '',
            prima_tipo: player.acciones?.prima_tipo ?? '',
            prima_cantidad: player.acciones?.prima_cantidad ?? ''
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditData(null);
    };

    const saveEditing = () => {
        if (!editingId || !editData) return;
        
        onUpdatePlayer(editingId, {
            salario: editData.salario === '' ? null : Number(editData.salario),
            fin_contrato: editData.fin_contrato || null,
            prima_tipo: editData.prima_tipo || null,
            prima_cantidad: editData.prima_cantidad === '' ? null : Number(editData.prima_cantidad)
        });

        setEditingId(null);
        setEditData(null);
    };

    return (
        <div className="w-full bg-[#1c2025] rounded-xl border border-zinc-800/50 overflow-hidden shadow-xl">
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded relative overflow-hidden bg-zinc-800">
                         {/* Placeholder for UCAM Shield */}
                         <SafeImage src={null} fallbackType="club" alt="UCAM CF" fill />
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-white uppercase">Plantilla Actual — UCAM CF</h2>
                </div>
                <div className="text-sm text-zinc-400">
                    Total Jugadores: <span className="text-white font-medium">{players.length}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#1c2025] text-zinc-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-zinc-800 z-10">
                        <tr>
                            <th className="px-4 py-3 font-medium">Jugador</th>
                            <th className="px-3 py-3 font-medium text-center">Pos</th>
                            <th className="px-2 py-3 font-medium text-center" title="Partidos Jugados">PJ</th>
                            <th className="px-2 py-3 font-medium text-center" title="Partidos Titular">PT</th>
                            <th className="px-3 py-3 font-medium text-right">Min</th>
                            <th className="px-2 py-3 font-medium text-center">Gol</th>
                            <th className="px-2 py-3 font-medium text-center">Asist</th>
                            <th className="px-2 py-3 font-medium text-center">🟨</th>
                            <th className="px-2 py-3 font-medium text-center">🟥</th>
                            <th className="px-2 py-3 font-medium text-center text-green-500/70">G</th>
                            <th className="px-2 py-3 font-medium text-center text-zinc-500/70">E</th>
                            <th className="px-2 py-3 font-medium text-center text-red-500/70">P</th>
                            <th className="px-4 py-3 font-medium">Val. Mercado</th>
                            <th className="px-4 py-3 font-medium">Fin Contrato</th>
                            <th className="px-4 py-3 font-medium">Salario</th>
                            <th className="px-4 py-3 font-medium">Prima (Tipo)</th>
                            <th className="px-4 py-3 font-medium">Prima (€)</th>
                            <th className="px-4 py-3 font-medium text-center">Notas</th>
                            <th className="px-4 py-3 font-medium text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {players.map((player) => {
                            const isEditing = editingId === player.id_jugador;
                            
                            // Color coding for positions
                            let rowBg = "hover:bg-zinc-800/30 transition-colors group";
                            if (player.posicion === 'POR') rowBg += " bg-yellow-900/5";
                            else if (['DFC','LD','LI'].includes(player.posicion)) rowBg += " bg-blue-900/5";
                            else if (['MCD','MC','MCO'].includes(player.posicion)) rowBg += " bg-emerald-900/5";
                            else rowBg += " bg-rose-900/5"; // Forwards
                            
                            if (isEditing) rowBg = "bg-[var(--color-bescout-cyan)]/5 ring-1 ring-inset ring-[var(--color-bescout-cyan)]/30";

                            return (
                                <tr key={player.id_jugador} className={rowBg}>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-700/50 bg-zinc-800">
                                                <SafeImage src={player.imagen_url} fallbackType="player" alt={player.nombre_corto} fill className="object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-white">{player.nombre_corto}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <Badge variant={player.posicion.toLowerCase() as any}>{player.posicion}</Badge>
                                    </td>
                                    <td className="px-2 py-2 text-center text-zinc-300">{player.partidos_jugados ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-zinc-300">{player.partidos_titular ?? '-'}</td>
                                    <td className="px-3 py-2 text-right font-medium text-white">{player.minutos ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-[var(--color-bescout-cyan)] font-medium">{player.goles ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-zinc-300">{player.asistencias ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-[var(--color-bescout-yellow)]">{player.tarjetas_amarillas ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-red-500">{player.tarjetas_rojas ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-green-400">{player.ganados ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-zinc-400">{player.empatados ?? '-'}</td>
                                    <td className="px-2 py-2 text-center text-red-400">{player.perdidos ?? '-'}</td>
                                    <td className="px-4 py-2 text-zinc-300">{formatCurrency(player.valor_mercado)}</td>
                                    
                                    {/* Inline Editing Fields */}
                                    <td className="px-4 py-2 text-zinc-300">
                                        {isEditing && editData ? (
                                            <input 
                                                type="text" 
                                                placeholder="DD/MM/AAAA"
                                                className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-bescout-cyan)]"
                                                value={editData.fin_contrato}
                                                onChange={e => setEditData({...editData, fin_contrato: e.target.value})}
                                            />
                                        ) : (
                                            player.acciones?.fin_contrato ?? '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-zinc-300">
                                        {isEditing && editData ? (
                                            <input 
                                                type="number" 
                                                placeholder="€"
                                                className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-bescout-cyan)]"
                                                value={editData.salario}
                                                onChange={e => setEditData({...editData, salario: e.target.value === '' ? '' : Number(e.target.value)})}
                                            />
                                        ) : (
                                            formatSalary(player.salario)
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-zinc-300">
                                        {isEditing && editData ? (
                                            <input 
                                                type="text" 
                                                placeholder="Tipo de prima"
                                                className="w-32 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-bescout-cyan)]"
                                                value={editData.prima_tipo}
                                                onChange={e => setEditData({...editData, prima_tipo: e.target.value})}
                                            />
                                        ) : (
                                            <span className="truncate block max-w-[120px]" title={player.acciones?.prima_tipo ?? ''}>
                                                {player.acciones?.prima_tipo ?? '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-zinc-300">
                                        {isEditing && editData ? (
                                            <input 
                                                type="number" 
                                                placeholder="€"
                                                className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-bescout-cyan)]"
                                                value={editData.prima_cantidad}
                                                onChange={e => setEditData({...editData, prima_cantidad: e.target.value === '' ? '' : Number(e.target.value)})}
                                            />
                                        ) : (
                                            player.acciones?.prima_cantidad ? `€${player.acciones.prima_cantidad.toLocaleString()}` : '-'
                                        )}
                                    </td>
                                    
                                    <td className="px-4 py-2 text-center">
                                        <button 
                                            onClick={() => onOpenNotes(player)}
                                            className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-zinc-800 transition-colors relative group/note"
                                        >
                                            <ClipboardList className="w-4 h-4 text-zinc-400 group-hover/note:text-[var(--color-bescout-cyan)]" />
                                            {player.notas_privadas?.length > 0 && (
                                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--color-bescout-cyan)] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                                                    {player.notas_privadas.length}
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {isEditing ? (
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={saveEditing} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30" title="Guardar">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={cancelEditing} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30" title="Cancelar">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => startEditing(player)} 
                                                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {players.length === 0 && (
                            <tr>
                                <td colSpan={20} className="px-6 py-10 text-center text-zinc-500">
                                    No hay jugadores en la plantilla.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
