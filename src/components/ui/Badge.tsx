import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'por' | 'ld' | 'li' | 'dfc' | 'mcd' | 'mc' | 'mco' | 'ei' | 'ed' | 'dc' | 'yes' | 'no' | 'nd' | 'default';
    className?: string;
    dot?: boolean;
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {

    const variants: Record<string, string> = {
        por: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
        ld: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
        li: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
        dfc: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
        mcd: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
        mc: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
        mco: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
        ei: 'bg-red-500/10 text-red-500 border border-red-500/20',
        ed: 'bg-red-500/10 text-red-500 border border-red-500/20',
        dc: 'bg-red-500/10 text-red-500 border border-red-500/20',
        yes: 'bg-[var(--color-bescout-accent-yes)] text-white font-bold',
        no: 'bg-[var(--color-bescout-accent-no)]/30 text-[var(--color-bescout-accent-no)] font-bold',
        nd: 'bg-zinc-800 text-zinc-400 font-bold',
        default: 'bg-zinc-800 text-zinc-300'
    };

    const dotColors: Record<string, string> = {
        por: 'bg-yellow-500',
        ld: 'bg-blue-500',
        li: 'bg-blue-500',
        dfc: 'bg-blue-500',
        mcd: 'bg-emerald-500',
        mc: 'bg-emerald-500',
        mco: 'bg-emerald-500',
        ei: 'bg-red-500',
        ed: 'bg-red-500',
        dc: 'bg-red-500',
        yes: '',
        no: '',
        nd: '',
        default: ''
    };

    const hasDot = dot && ['por', 'ld', 'li', 'dfc', 'mcd', 'mc', 'mco', 'ei', 'ed', 'dc'].includes(variant);

    return (
        <span className={cn(
            "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium uppercase",
            variants[variant] || variants.default,
            className
        )}>
            {hasDot && (
                <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0", dotColors[variant])} />
            )}
            {children}
        </span>
    );
}
