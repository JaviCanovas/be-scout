import { notFound } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import { Badge } from "@/components/ui/Badge";
import { EloIndicator } from "@/components/ui/EloIndicator";
import { Sub23Badge } from "@/components/ui/Sub23Badge";
import { KpiCard } from "@/components/player/KpiCard";
import { CareerHistory } from "@/components/player/CareerHistory";
import { formatCurrency } from "@/lib/utils";
import { isU23 } from "@/lib/scouting-engine";
import Link from "next/link";
import { ChevronLeft, User, Shield, TrendingUp, Calendar, Clock } from "lucide-react";
import { MarketValueChart } from "@/components/player/MarketValueChart";
import { supabase } from "@/lib/supabase";
import { Jugador } from '@/types';

// En un entorno Next.js App Router (v13+), params es una promesa
export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Buscar el jugador en Supabase por id_jugador
    const { data: row, error } = await supabase
        .from('jugadores')
        .select('*')
        .eq('id_jugador', id)
        .single();

    if (error || !row) {
        notFound();
    }

    // Mapear esquema plano de Supabase al tipo Jugador anidado
    const player: Jugador = {
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
    };


    const isPlayerU23 = isU23(player.biometria.edad);

    const getPositionCoords = (pos: string | null | undefined) => {
        switch (pos) {
            case 'POR': return { top: '85%', left: '50%' };
            case 'DFC': return { top: '70%', left: '50%' };
            case 'LD': return { top: '70%', left: '85%' };
            case 'LI': return { top: '70%', left: '15%' };
            case 'MCD': return { top: '55%', left: '50%' };
            case 'MC': return { top: '45%', left: '50%' };
            case 'MCO': return { top: '30%', left: '50%' };
            case 'EI': return { top: '20%', left: '20%' };
            case 'ED': return { top: '20%', left: '80%' };
            case 'DC': return { top: '15%', left: '50%' };
            default: return { top: '40%', left: '50%' };
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
                <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900/50 text-[var(--color-bescout-cyan)] hover:bg-zinc-800 transition-colors text-sm font-medium">
                    <ChevronLeft className="w-4 h-4" />
                    Volver a la Base de Datos
                </Link>
                <div className="text-zinc-500 text-sm hidden sm:block">
                    Base de Datos &gt; Perfil de Jugador: <span className="text-white">{player.nombre_corto}</span>
                </div>
            </div>

            {/* Main Grid */}
            <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Column 1: Identity Profile */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden">

                        {/* Age / Position top tags */}
                        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                            <span className="text-2xl font-bold text-white">{player.biometria.edad ?? '-'}</span>
                            <span className="text-sm text-zinc-400 font-medium">{player.posicion}</span>
                        </div>

                        <div className="absolute top-4 left-4">
                            <div className="w-12 h-14 relative opacity-60 mix-blend-screen">
                                <SafeImage src={null} fallbackType="club" alt="Club Logo" fill className="object-cover" />
                            </div>
                        </div>

                        <div className="w-32 h-32 relative rounded-full overflow-hidden border-4 border-zinc-800 my-4 bg-zinc-800">
                            <SafeImage src={player.imagen_url} fallbackType="player" alt={player.nombre_completo} fill className="object-cover" />
                        </div>

                        <h1 className="text-2xl font-bold text-white tracking-tight mt-2">{player.nombre_corto}</h1>

                        <div className="grid grid-cols-3 gap-4 w-full mt-6 text-sm">
                            <div className="flex flex-col">
                                <span className="text-zinc-500 mb-1">Edad</span>
                                <span className="text-zinc-300 font-medium whitespace-nowrap">{player.biometria.edad ? `${player.biometria.edad} años` : '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-zinc-500 mb-1">Pie Dominante</span>
                                <span className="text-zinc-300 font-medium">{player.biometria.pie_dominante ?? '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-zinc-500 mb-1">Altura / Peso</span>
                                <span className="text-zinc-300 font-medium">{player.biometria.altura ?? '-'}cm / {player.biometria.peso ?? '-'}kg</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <KpiCard
                            title="Valor de Mercado"
                            value={formatCurrency(player.contrato.valor_mercado)}
                            icon={<TrendingUp className="w-5 h-5" />}
                        />
                        <KpiCard
                            title="Fin de Contrato"
                            value={<span className="text-lg tracking-tighter whitespace-nowrap">{player.contrato.fin_contrato ?? '-'}</span>}
                            icon={<Calendar className="w-5 h-5 opacity-80" />}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <KpiCard
                            title="Minutos Jugados"
                            value={player.estadisticas.minutos_totales ?? '-'}
                            icon={<Clock className="w-5 h-5 opacity-80" />}
                        />
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                            <h3 className="text-zinc-400 text-sm font-medium mb-3">Estado Sub-23</h3>
                            <Sub23Badge isU23={isPlayerU23} />
                        </div>
                    </div>
                </div>

                {/* Column 2/3: Middle Section (Career & ELO) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                        <CareerHistory />

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center relative">
                            <div className="absolute top-4 right-4 text-xs text-zinc-500 border border-zinc-700 px-2 py-1 rounded">BESOCCER</div>
                            <h3 className="text-zinc-400 text-sm font-medium mb-4">Valoración ELO Besoccer</h3>
                            <EloIndicator elo={player.puntuacion_elo} size="lg" />
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 w-full flex-1 min-h-[250px] flex items-center justify-center relative">
                        {/* Radar Chart Mock Placeholder per PRD rule: "excluding radar/evolution charts per Phase 1" */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <Shield className="w-24 h-24 text-zinc-800 opacity-30 mb-4" />
                            <p className="text-zinc-500 text-sm italic">Gráfico Radar y Estadísticas Avanzadas deshabilitadas en esta Fase</p>
                        </div>
                    </div>
                </div>

                {/* Column 4: Right Section (Pitch / Market Graph) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Pitch */}
                    <div className="bg-[#2d6a4f] border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center h-48 relative overflow-hidden shadow-inner">

                        {/* SVG Pitch Background */}
                        <svg viewBox="0 0 200 300" className="absolute inset-0 w-full h-full opacity-60" preserveAspectRatio="none">
                            {/* Pitch stripes */}
                            <rect width="200" height="50" y="0" fill="#1b4332" opacity="0.6" />
                            <rect width="200" height="50" y="100" fill="#1b4332" opacity="0.6" />
                            <rect width="200" height="50" y="200" fill="#1b4332" opacity="0.6" />
                            {/* Lines */}
                            <rect width="180" height="280" x="10" y="10" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                            <line x1="10" y1="150" x2="190" y2="150" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                            <circle cx="100" cy="150" r="25" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                            <rect width="80" height="40" x="60" y="10" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                            <rect width="80" height="40" x="60" y="250" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                            <path d="M 60,50 A 40,40 0 0,0 140,50" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                            <path d="M 60,250 A 40,40 0 0,1 140,250" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                        </svg>

                        {/* Player Position Dot */}
                        {player.posicion_secundaria && (
                            <div
                                className="w-8 h-8 bg-black/40 border-2 border-white/30 text-white/70 rounded-full absolute z-10 flex items-center justify-center text-[10px] font-bold backdrop-blur-sm"
                                style={{
                                    left: getPositionCoords(player.posicion_secundaria).left,
                                    top: getPositionCoords(player.posicion_secundaria).top,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                {player.posicion_secundaria}
                            </div>
                        )}
                        <div
                            className="w-8 h-8 bg-white border-2 border-zinc-900 rounded-full absolute z-20 shadow-lg flex items-center justify-center text-[10px] font-bold text-zinc-900"
                            style={{
                                left: getPositionCoords(player.posicion).left,
                                top: getPositionCoords(player.posicion).top,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {player.posicion}
                        </div>

                        <div className="absolute bottom-4 flex flex-col items-center text-center bg-black/50 px-3 py-1 rounded-lg backdrop-blur-sm max-w-[90%]">
                            <span className="text-white font-bold text-xs uppercase text-center leading-tight">
                                {player.posicion === 'POR' ? 'Portero' :
                                    player.posicion === 'LD' ? 'Lateral Derecho' :
                                        player.posicion === 'LI' ? 'Lateral Izquierdo' :
                                            player.posicion === 'DFC' ? 'Defensa Central' :
                                                player.posicion === 'MCD' ? 'Mediocentro Defensivo' :
                                                    player.posicion === 'MC' ? 'Mediocentro' :
                                                        player.posicion === 'MCO' ? 'Mediocentro Ofensivo' :
                                                            player.posicion === 'EI' ? 'Extremo Izquierdo' :
                                                                player.posicion === 'ED' ? 'Extremo Derecho' :
                                                                    player.posicion === 'DC' ? 'Delantero Centro' : player.posicion}
                            </span>
                            {player.posicion_secundaria && (
                                <span className="text-zinc-400 text-[10px] uppercase mt-0.5">
                                    Alt: {player.posicion_secundaria}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Market Value Graph MVP state */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex-1 relative flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-zinc-400 text-sm font-medium">Histórico de Valor</h3>
                            <button className="text-xs text-[var(--color-bescout-cyan)] border border-[var(--color-bescout-cyan)]/50 rounded-full px-3 py-1 bg-[var(--color-bescout-cyan)]/10 hover:bg-[var(--color-bescout-cyan)]/20 transition-colors">
                                Añadir a la Lista
                            </button>
                        </div>

                        {/* Recharts Component representing historical value */}
                        <MarketValueChart currentValue={player.contrato.valor_mercado} />
                    </div>

                </div>
            </main>
        </div>
    );
}
