import { Info } from "lucide-react";

export function CareerHistory() {
    const history = [
        { club: "Real Avilés CF", season: "2023-XX-XX", name: "Alex S.", logo: null },
        { club: "Real Avilés B", season: "2022-06-30", name: "Javier P.", logo: null },
        { club: "Real Avilés Juvenil", season: "2023-06-30", name: "Carlos L.", logo: null }
    ];

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 w-full h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm text-zinc-300 font-medium">Historial de Carrera</h3>
            </div>
            <div className="space-y-4">
                {history.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 overflow-hidden relative">
                                {/* SafeImage or Shield mockup */}
                                <Info className="w-4 h-4 opacity-50" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">{item.club}</span>
                                <span className="text-xs text-zinc-500">{item.name}</span>
                            </div>
                        </div>
                        <div className="text-sm text-zinc-400 font-medium">
                            {item.season}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
