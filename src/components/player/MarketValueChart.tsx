'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function MarketValueChart({ currentValue }: { currentValue: number | null }) {
    if (currentValue === null) return <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">Sin datos históricos</div>;

    // Generar datos históricos falsos para ilustrar la subida (Fase 1 Mock)
    const data = [
        { season: '21/22', value: currentValue * 0.4 },
        { season: '22/23', value: currentValue * 0.65 },
        { season: '23/24', value: currentValue * 0.9 },
        { season: '24/25', value: currentValue }
    ];

    return (
        <div className="flex-1 w-full h-full min-h-[150px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="season" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis
                        stroke="#52525b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value >= 1000000 ? `€${(value / 1000000).toFixed(1)}M` : `€${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                        itemStyle={{ color: 'var(--color-bescout-cyan)' }}
                        formatter={(val: any) => [formatCurrency(val as number), 'Valor']}
                        labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--color-bescout-cyan)" strokeWidth={3} dot={{ fill: 'var(--color-bescout-cyan)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
