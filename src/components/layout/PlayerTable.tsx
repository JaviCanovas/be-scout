'use client';

import { Jugador } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { SafeImage } from "@/components/ui/SafeImage";
import { EloIndicator } from "@/components/ui/EloIndicator";
import { Star, ClipboardList } from "lucide-react";
import Link from "next/link"; 

interface PlayerTableProps {
    players: Jugador[];
    onToggleFollow?: (id: string, currentlyFollowed: boolean) => void;
    onOpenNotes?: (player: Jugador) => void;
}

export function PlayerTable({ players, onToggleFollow, onOpenNotes }: PlayerTableProps) {
    return (
        <div className="w-full bg-[#1c2025] rounded-xl border border-zinc-800/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-tight text-white uppercase">Base de Datos de Jugadores</h1>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-400">Encontrados: {players.length} Jugadores</span>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Mostrando 1-{players.length}</span>
                        <div className="flex gap-1 ml-2">
                            <button className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800">&lt;</button>
                            <button className="w-6 h-6 rounded flex items-center justify-center bg-[var(--color-bescout-cyan)] text-white text-xs font-bold">1</button>
                            <button className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700">&gt;</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#1c2025] text-zinc-400 text-xs uppercase sticky top-0 border-b border-zinc-800 z-10">
                        <tr>
                            <th className="px-4 py-3 font-medium w-10"></th>
                            <th className="px-4 py-3 font-medium">Jugador</th>
                            <th className="px-4 py-3 font-medium text-center">Edad</th>
                            <th className="px-4 py-3 font-medium text-center">Posición</th>
                            <th className="px-4 py-3 font-medium">Club Actual</th>
                            <th className="px-4 py-3 font-medium">Valor de Mercado</th>
                            <th className="px-4 py-3 font-medium">Fin de Contrato</th>
                            <th className="px-6 py-3 font-medium text-right">Min. Jugados<br /><span className="text-[10px] text-zinc-500 capitalize font-normal">(Temporada)</span></th>
                            <th className="px-6 py-3 font-medium text-center">ELO</th>
                            {onOpenNotes && <th className="px-4 py-3 font-medium text-center">Notas</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {players.map((player) => {
                            return (
                                <tr key={player.id_jugador} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => onToggleFollow && onToggleFollow(player.id_jugador, !!player.es_seguido)}
                                            className="text-zinc-600 hover:text-yellow-500 transition-colors cursor-pointer"
                                            title={player.es_seguido ? "Dejar de seguir" : "Seguir jugador"}
                                        >
                                            <Star className={`w-5 h-5 ${player.es_seguido ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link href={`/player/${player.id_jugador}`} className="flex items-center gap-3">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-700/50 bg-zinc-800">
                                                <SafeImage src={player.imagen_url} fallbackType="player" alt={player.nombre_corto} fill className="object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-white group-hover:text-[var(--color-bescout-cyan)] transition-colors">{player.nombre_completo.split(' ').slice(0, 2).join(' ')}</span>
                                                <span className="text-xs text-zinc-500">{player.nombre_corto}</span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-center text-zinc-300">
                                        <div className="flex items-center justify-center gap-2">
                                            <span>{player.biometria.edad ?? '-'}</span>
                                            {player.es_sub23 && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--color-bescout-cyan)]/20 text-[var(--color-bescout-cyan)] border border-[var(--color-bescout-cyan)]/30">
                                                    SUB-23
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant={player.posicion.toLowerCase() as any} dot>{player.posicion}</Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {/* Mocking club shield */}
                                            <div className="w-5 h-5 rounded-sm relative opacity-90 bg-zinc-800 border border-zinc-700/50 overflow-hidden flex-shrink-0">
                                                <SafeImage src={null} fallbackType="club" alt="Club" fill />
                                            </div>
                                            <span className="text-zinc-300 truncate">{player.club_actual ?? '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300">
                                        {formatCurrency(player.contrato.valor_mercado)}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300">
                                        {player.contrato.fin_contrato ?? '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right font-medium text-white">
                                        {player.estadisticas.minutos_totales ?? '-'}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <EloIndicator elo={player.puntuacion_elo} size="sm" />
                                    </td>
                                    {onOpenNotes && (
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => onOpenNotes(player)}
                                                className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-zinc-800 transition-colors relative group/note"
                                                title="Ver notas privadas"
                                            >
                                                <ClipboardList className="w-4 h-4 text-zinc-400 group-hover/note:text-[var(--color-bescout-cyan)]" />
                                                {player.notas_privadas && player.notas_privadas.length > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--color-bescout-cyan)] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                                                        {player.notas_privadas.length}
                                                    </span>
                                                )}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            )
                        })}

                        {players.length === 0 && (
                            <tr>
                                <td colSpan={onOpenNotes ? 10 : 9} className="px-6 py-10 text-center text-zinc-500">
                                    No se encontraron jugadores que coincidan con los filtros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
