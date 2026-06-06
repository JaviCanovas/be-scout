import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null): string {
    if (value === null) return "N/A";
    if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
    return `€${value}`;
}

export function calculateAge(birthDateString?: string | null): number | null {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function formatSalary(value: number | null): string {
    if (value === null) return '-';
    return `€${value.toLocaleString('es-ES')}/año`;
}

export function formatDateDDMMYYYY(date: string | null): string {
    if (!date) return '-';
    // If already in DD/MM/YYYY format, return as-is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
    // Try to parse ISO or YYYY-MM-DD
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function getLocalStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : null;
    } catch {
        return null;
    }
}

export function setLocalStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Silently fail if storage is full
    }
}
