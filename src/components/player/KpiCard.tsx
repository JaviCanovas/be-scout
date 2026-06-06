import { cn } from "@/lib/utils";
import React from "react";

interface KpiCardProps {
    title: string;
    value: React.ReactNode;
    subtitle?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export function KpiCard({ title, value, subtitle, className, icon }: KpiCardProps) {
    return (
        <div className={cn("bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center text-center", className)}>
            <div className="flex items-center gap-1.5 justify-center mb-2">
                <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
                {icon && <div className="text-[var(--color-bescout-cyan)]">{icon}</div>}
            </div>
            <div className="flex items-center justify-center">
                <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
            </div>
            {subtitle && (
                <div className="text-xs text-zinc-500 mt-2 font-medium">
                    {subtitle}
                </div>
            )}
        </div>
    );
}
