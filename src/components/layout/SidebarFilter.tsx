'use client';

import { FilterOptions } from "@/lib/scouting-engine";
import { cn } from "@/lib/utils";
import { Search, Star } from "lucide-react";

interface SidebarFilterProps {
    filters: FilterOptions;
    setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
    className?: string;
}

export function SidebarFilter({ filters, setFilters, className }: SidebarFilterProps) {

    const handleCompetitionToggle = (comp: string) => {
        setFilters(prev => {
            const arr = prev.competition || [];
            if (arr.includes(comp)) {
                return { ...prev, competition: arr.filter(c => c !== comp) };
            }
            return { ...prev, competition: [...arr, comp] };
        });
    };

    const handlePositionToggle = (pos: any) => {
        setFilters(prev => {
            const arr = prev.positions || [];
            if (arr.includes(pos)) {
                return { ...prev, positions: arr.filter(p => p !== pos) };
            }
            return { ...prev, positions: [...arr, pos] };
        });
    }

    const positions: ('POR' | 'LD' | 'LI' | 'DFC' | 'MCD' | 'MC' | 'MCO' | 'EI' | 'ED' | 'DC')[] = ['POR', 'LD', 'LI', 'DFC', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'];
    const positionLabels = {
        POR: 'POR',
        LD: 'LD',
        LI: 'LI',
        DFC: 'DFC',
        MCD: 'MCD',
        MC: 'MC',
        MCO: 'MCO',
        EI: 'EI',
        ED: 'ED',
        DC: 'DC'
    };

    const formatShortCurr = (v: number) => {
        if (v >= 1000000) return `€${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `€${(v / 1000).toFixed(0)}K`;
        return `€${v}`;
    }

    return (
        <div className={cn("bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-6", className)}>
            <div>
                <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Filtros</h2>

                {/* Search */}
                <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Buscar Jugador</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar Jugador"
                            className="w-full bg-[#1c2025] border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Competition */}
            <div className="space-y-3">
                <label className="text-sm text-zinc-400">Competición</label>
                <div className="space-y-2">
                    {['Segunda RFEF', 'Tercera RFEF', 'División de Honor Juvenil'].map((comp) => {
                        const isActive = filters.competition?.includes(comp);
                        return (
                            <button
                                key={comp}
                                onClick={() => handleCompetitionToggle(comp)}
                                className="flex items-center justify-between w-full group py-1"
                            >
                                <span className={cn("text-sm transition-colors text-left", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")}>
                                    {comp}
                                </span>
                                <div className={cn(
                                    "w-8 h-4 rounded-full flex items-center px-0.5 transition-colors shrink-0",
                                    isActive ? "bg-[var(--color-bescout-cyan)]/20" : "bg-zinc-800"
                                )}>
                                    <div className={cn(
                                        "w-3 h-3 rounded-full transition-transform",
                                        isActive ? "bg-[var(--color-bescout-cyan)] translate-x-4" : "bg-zinc-600"
                                    )} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Club */}
            <div className="space-y-2">
                <label className="text-sm text-zinc-400">Club</label>
                <select
                    className="w-full bg-[#1c2025] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-zinc-700 appearance-none"
                    value={filters.club || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, club: e.target.value || null }))}
                >
                    <option value="">Todos los Clubes</option>
                    <option value="Real Avilés CF">Real Avilés CF</option>
                    <option value="AD Ceuta FC">AD Ceuta FC</option>
                    <option value="SD Logroñés">SD Logroñés</option>
                    <option value="Mérida AD">Mérida AD</option>
                    <option value="CE Sabadell FC">CE Sabadell FC</option>
                </select>
            </div>

            {/* Position */}
            <div className="space-y-3">
                <label className="text-sm text-zinc-400">Posición</label>
                <div className="flex flex-wrap gap-2">
                    {positions.map(pos => {
                        const isSelected = filters.positions.includes(pos);
                        return (
                            <button
                                key={pos}
                                onClick={() => handlePositionToggle(pos)}
                                className={cn(
                                    "py-1.5 px-3 rounded-md text-xs font-medium border text-center transition-colors",
                                    isSelected
                                        ? "bg-zinc-800 border-zinc-600 text-[var(--color-bescout-cyan)]"
                                        : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                                )}
                            >
                                {positionLabels[pos]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Age */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400">Rango de Edad</label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="15" max="50"
                        value={filters.ageRange[0]}
                        onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [e.target.value === '' ? '' : parseInt(e.target.value), prev.ageRange[1]] }))}
                        className="w-1/2 bg-[#1c2025] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-zinc-700"
                        placeholder="Mín"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                        type="number"
                        min="15" max="50"
                        value={filters.ageRange[1]}
                        onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [prev.ageRange[0], e.target.value === '' ? '' : parseInt(e.target.value)] }))}
                        className="w-1/2 bg-[#1c2025] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-zinc-700"
                        placeholder="Máx"
                    />
                </div>
            </div>

            {/* U-23 Status */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <label className="text-sm text-zinc-400 block">Solo Sub-23</label>
                        <span className="text-xs text-zinc-600 block">On/Off</span>
                    </div>
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, onlyU23: !prev.onlyU23 }))}
                        className={cn(
                            "w-12 h-6 rounded-full flex items-center px-1 transition-colors relative shrink-0",
                            filters.onlyU23 ? "bg-[var(--color-bescout-accent-yes)]" : "bg-zinc-800"
                        )}
                    >
                        {filters.onlyU23 && <span className="absolute left-2 text-[10px] font-bold text-white">ON</span>}
                        <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-transform z-10",
                            filters.onlyU23 ? "translate-x-6" : ""
                        )} />
                    </button>
                </div>
            </div>

            {/* Minutes */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400">Minutos Jugados</label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0" max="3000" step="100"
                        value={filters.minutesPlayed[0]}
                        onChange={(e) => setFilters(prev => ({ ...prev, minutesPlayed: [e.target.value === '' ? '' : parseInt(e.target.value), prev.minutesPlayed[1]] }))}
                        className="w-1/2 bg-[#1c2025] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-zinc-700"
                        placeholder="Mín"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                        type="number"
                        min="0" max="3000" step="100"
                        value={filters.minutesPlayed[1]}
                        onChange={(e) => setFilters(prev => ({ ...prev, minutesPlayed: [prev.minutesPlayed[0], e.target.value === '' ? '' : parseInt(e.target.value)] }))}
                        className="w-1/2 bg-[#1c2025] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-zinc-700"
                        placeholder="Máx"
                    />
                </div>
            </div>

            {/* Market Value */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400">Valor de Mercado (€)</label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0" max="5000000" step="50000"
                        value={filters.marketValue[0]}
                        onChange={(e) => setFilters(prev => ({ ...prev, marketValue: [e.target.value === '' ? '' : parseInt(e.target.value), prev.marketValue[1]] }))}
                        className="w-1/2 bg-[#1c2025] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-zinc-700"
                        placeholder="Mín"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                        type="number"
                        min="0" max="5000000" step="50000"
                        value={filters.marketValue[1]}
                        onChange={(e) => setFilters(prev => ({ ...prev, marketValue: [prev.marketValue[0], e.target.value === '' ? '' : parseInt(e.target.value)] }))}
                        className="w-1/2 bg-[#1c2025] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-zinc-700"
                        placeholder="Máx"
                    />
                </div>
            </div>

            {/* Valoración (Estrellas) */}
            <div className="space-y-3 pt-2 border-t border-zinc-800/60">
                <label className="text-sm text-zinc-400">Valoración Mínima</label>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                        const isSelected = filters.minRating !== null && filters.minRating >= star;
                        return (
                            <button
                                key={star}
                                type="button"
                                onClick={() => {
                                    setFilters(prev => ({
                                        ...prev,
                                        minRating: prev.minRating === star ? null : star
                                    }));
                                }}
                                className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                title={`Filtrar por ${star} o más estrellas`}
                            >
                                <Star
                                    className={cn(
                                        "w-5 h-5 transition-colors",
                                        isSelected
                                            ? "fill-yellow-500 text-yellow-500"
                                            : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                />
                            </button>
                        );
                    })}
                    {filters.minRating !== null && (
                        <button
                            type="button"
                            onClick={() => setFilters(prev => ({ ...prev, minRating: null }))}
                            className="text-xs text-zinc-500 hover:text-zinc-300 ml-2 underline cursor-pointer"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}
