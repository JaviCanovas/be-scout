import { Jugador } from "@/types";

export interface FilterOptions {
    searchTerm: string;
    competition: string[] | null;
    club: string | null;
    positions: ('POR' | 'LD' | 'LI' | 'DFC' | 'MCD' | 'MC' | 'MCO' | 'EI' | 'ED' | 'DC')[];
    ageRange: [number | '', number | ''];
    onlyU23: boolean;
    minutesPlayed: [number | '', number | ''];
    marketValue: [number | '', number | ''];
    minRating: number | null;
}

export function isU23(edad: number | null): boolean {
    if (edad === null) return false;
    return edad <= 23;
}

export function filterPlayers(players: Jugador[], filters: FilterOptions): Jugador[] {
    return players.filter((player) => {
        // Star Rating Filter
        if (filters.minRating !== null && filters.minRating !== undefined && filters.minRating > 0) {
            const pRating = player.valoracion_estrellas ?? 0;
            if (pRating < filters.minRating) return false;
        }

        // Search Term
        if (filters.searchTerm && !player.nombre_completo.toLowerCase().includes(filters.searchTerm.toLowerCase()) && !player.nombre_corto.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
            return false;
        }

        // Competition (multiple)
        if (filters.competition && filters.competition.length > 0 && player.competicion) {
            if (!filters.competition.includes(player.competicion)) return false;
        }

        // Club
        if (filters.club && player.club_actual !== filters.club) {
            return false;
        }

        // Positions (multiple)
        if (filters.positions && filters.positions.length > 0) {
            if (!filters.positions.includes(player.posicion)) return false;
        }

        // U-23 Status
        if (filters.onlyU23 && !isU23(player.biometria.edad)) {
            return false;
        }

        // Age Range
        const age = player.biometria.edad;
        const minAge = filters.ageRange[0] === '' ? 0 : filters.ageRange[0];
        const maxAge = filters.ageRange[1] === '' ? 100 : filters.ageRange[1];

        if (age !== null) {
            if (age < minAge || age > maxAge) return false;
        } else if (minAge > 18 || maxAge < 50) {
            return false; // Age matters to the user now, avoid showing nulls if filtering heavily
        }

        // Minutes Played
        const mins = player.estadisticas.minutos_totales;
        const minMins = filters.minutesPlayed[0] === '' ? 0 : filters.minutesPlayed[0];
        const maxMins = filters.minutesPlayed[1] === '' ? 99999 : filters.minutesPlayed[1];

        if (mins !== null) {
            if (mins < minMins || mins > maxMins) return false;
        } else if (minMins > 0 || maxMins < 3000) {
            return false;
        }

        // Market Value
        const marketValue = player.contrato.valor_mercado;
        const minMarket = filters.marketValue[0] === '' ? 0 : filters.marketValue[0];
        const maxMarket = filters.marketValue[1] === '' ? 999999999 : filters.marketValue[1];

        if (marketValue !== null) {
            if (marketValue < minMarket || marketValue > maxMarket) return false;
        } else if (minMarket > 0 || maxMarket < 5000000) {
            return false;
        }

        return true;
    });
}
