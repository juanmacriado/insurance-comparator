import { ComparisonReport } from "@/lib/comparator";
import { Check, MapPin, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
    report: ComparisonReport;
    clientName?: string;
}

export function ComparisonTable({ report, clientName }: ComparisonTableProps) {
    const title = clientName
        ? `Propuestas para ${clientName}`
        : "Comparativa de Ciberseguros";

    return (
        <div className="bg-white rounded-[40px] shadow-[0_40px_100px_-30px_rgba(22,49,58,0.15)] border border-gray-100 overflow-hidden mb-16">
            {/* Header Block */}
            <div className="bg-xeoris-blue p-12 text-white relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter text-white uppercase italic leading-none">{title}</h2>
                        <div className="flex items-center gap-4 justify-center md:justify-start">
                            <div className="h-2 w-20 bg-xeoris-yellow rounded-full"></div>
                            <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-black">Estudio Comparativo | Xeoris Global Risk</p>
                        </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-xeoris-yellow/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-8 font-black text-xeoris-blue/30 uppercase tracking-[0.3em] text-[10px] w-64">Cobertura / Concepto</th>
                            {report.policyNames.map((name, i) => (
                                <th key={i} className="p-8 font-black text-xeoris-blue border-l border-gray-100 bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-xeoris-yellow text-xeoris-blue w-12 h-12 rounded-[15px] flex items-center justify-center text-sm font-black shadow-xl border-b-4 border-xeoris-blue/10">
                                            {i + 1}
                                        </div>
                                        <span className="truncate text-lg tracking-tighter uppercase font-black" title={name}>{name}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {report.items.map((item, idx) => {
                            const isPremiumRow = item.category.toLowerCase().includes('prima');

                            return (
                                <tr key={idx} className={cn(
                                    "border-b border-gray-50 transition-all group",
                                    isPremiumRow ? "bg-xeoris-yellow/10" : "hover:bg-gray-50/50"
                                )}>
                                    <td className="p-8 bg-gray-50/20">
                                        <div className="flex items-center gap-4">
                                            {!isPremiumRow && <Shield className="w-6 h-6 text-xeoris-blue/5 group-hover:text-xeoris-blue/40 transition-colors" />}
                                            <span className={cn(
                                                "font-black text-[11px] block uppercase tracking-widest leading-tight",
                                                isPremiumRow ? "text-xeoris-blue py-1 px-3 bg-xeoris-yellow/40 rounded-lg inline-block" : "text-xeoris-blue"
                                            )}>
                                                {item.category}
                                            </span>
                                        </div>
                                    </td>

                                    {item.policies.map((p, pIdx) => (
                                        <td key={pIdx} className="p-8 border-l border-gray-50 relative align-top">
                                            {p.isWinner && (
                                                <div className="absolute top-6 right-6 bg-xeoris-blue p-2.5 rounded-full shadow-2xl border-2 border-xeoris-yellow/30 scale-110">
                                                    <Check className="w-4 h-4 text-xeoris-yellow" />
                                                </div>
                                            )}

                                            <p className="text-[15px] text-xeoris-blue/70 leading-relaxed font-bold mb-8 italic">
                                                {p.details}
                                            </p>

                                            <div className="space-y-5">
                                                {p.amount !== "N/A" && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[8px] font-black text-xeoris-blue/20 uppercase tracking-[0.4em]">Suma Asegurada</span>
                                                        <span className="text-xeoris-blue font-black text-base bg-xeoris-yellow px-5 py-2.5 rounded-[15px] shadow-lg border-b-4 border-xeoris-blue/20 inline-block w-fit">
                                                            {p.amount}
                                                        </span>
                                                    </div>
                                                )}
                                                {p.deductible !== "N/A" && (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black text-xeoris-blue/30 uppercase tracking-widest">Franquicia:</span>
                                                        <span className="text-[13px] font-black text-xeoris-blue bg-white border border-gray-100 px-3 py-1 rounded-lg shadow-sm">{p.deductible}</span>
                                                    </div>
                                                )}
                                                {p.scope !== "No especificado" && p.scope !== "No analizado" && (
                                                    <div className="flex items-center gap-3 mt-4 pt-5 border-t border-gray-50">
                                                        <MapPin className="w-4 h-4 text-xeoris-yellow" />
                                                        <span className="text-[11px] text-xeoris-blue font-black italic truncate opacity-60" title={p.scope}>{p.scope}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
