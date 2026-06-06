import { cn } from "@/lib/utils";

interface EloIndicatorProps {
    elo: number | null;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    trend?: 'up' | 'down' | 'neutral'; // Based on image mockups
}

export function EloIndicator({ elo, className, size = 'sm', trend = 'neutral' }: EloIndicatorProps) {

    if (elo === null) {
        return <span className={cn("text-zinc-500 font-medium", className)}>N/A</span>;
    }

    // Get color scale based on ELO ratings typical logic, although mock says cyan
    // Usually cyan for all in the UI it seems, or could be graded. I'll use BeScout cyan.

    return (
        <div className={cn("flex flex-col items-center justify-center", className)}>
            <span className={cn(
                "font-bold text-[var(--color-bescout-cyan)]",
                size === 'sm' && "text-sm",
                size === 'md' && "text-2xl",
                size === 'lg' && "text-6xl"
            )}>
                {elo}
            </span>

            {size !== 'sm' && trend !== 'neutral' && (
                <span className={cn(
                    "text-xs font-medium flex items-center mt-1",
                    trend === 'up' ? "text-[var(--color-bescout-accent-yes)]" : "text-[var(--color-bescout-accent-no)]"
                )}>
                    {trend === 'up' ? '▲' : '▼'} {(Math.random() * 2).toFixed(1)}
                </span>
            )}
        </div>
    );
}
