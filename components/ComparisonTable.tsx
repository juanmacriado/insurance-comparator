import { ComparisonReport } from "@/lib/comparator";
import { Check, MapPin, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
    report: ComparisonReport;
    clientName?: string;
}

export function ComparisonTable({ report, clientName }: ComparisonTableProps) {
    const title = clientName
        ? `Diferentes soluciones para ${clientName}`
        : "Análisis Comparativo de Propuestas";

    return (
        <div className="bg-[#111827] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden mb-12">
            {/* Table Header Section */}
            <div className="bg-gradient-to-r from-xeoris-blue to-gray-900 p-8 text-white relative border-b border-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-xeoris-yellow tracking-tighter italic">{title}</h2>
                        <p className="text-xeoris-yellow/70 text-xs uppercase tracking-[0.2em] font-bold">Resumen de coberturas por Xeoris Global Risk</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-900/80 border-b border-gray-800">
                            <th className="p-6 font-black text-xeoris-yellow uppercase tracking-widest text-[10px] w-64">Categoría</th>
                            {report.policyNames.map((name, i) => (
                                <th key={i} className="p-6 font-black text-xeoris-yellow border-l border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-xeoris-yellow text-xeoris-blue w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black">
                                            {i + 1}
                                        </div>
                                        <span className="truncate text-sm" title={name}>{name}</span>
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
                                    "border-b border-gray-800/50 transition-colors group",
                                    isPremiumRow ? "bg-xeoris-yellow/[0.03]" : "hover:bg-white/[0.02]"
                                )}>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            {!isPremiumRow && <Shield className="w-4 h-4 text-xeoris-yellow/40 group-hover:text-xeoris-yellow transition-colors" />}
                                            <span className={cn(
                                                "font-bold text-sm block",
                                                isPremiumRow ? "text-xeoris-yellow" : "text-xeoris-yellow/90"
                                            )}>
                                                {item.category}
                                            </span>
                                        </div>
                                    </td>

                                    {item.policies.map((p, pIdx) => (
                                        <td key={pIdx} className="p-6 border-l border-gray-800 relative">
                                            {p.isWinner && (
                                                <div className="absolute top-4 right-4 bg-xeoris-yellow/20 p-1 rounded-full border border-xeoris-yellow/30 shadow-[0_0_10px_rgba(255,230,0,0.2)]">
                                                    <Check className="w-3 h-3 text-xeoris-yellow" />
                                                </div>
                                            )}

                                            <p className="text-xs text-white/80 mb-4 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                                                {p.details}
                                            </p>

                                            <div className="space-y-2">
                                                {p.amount !== "N/A" && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter">Suma:</span>
                                                        <span className="text-xeoris-yellow font-black text-xs bg-xeoris-yellow/10 px-2 py-0.5 rounded border border-xeoris-yellow/20 shadow-sm">
                                                            {p.amount}
                                                        </span>
                                                    </div>
                                                )}
                                                {p.deductible !== "N/A" && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Franq:</span>
                                                        <span className="text-[10px] font-semibold text-xeoris-yellow/70">{p.deductible}</span>
                                                    </div>
                                                )}
                                                {p.scope !== "No especificado" && p.scope !== "No analizado" && (
                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-800/50">
                                                        <MapPin className="w-2.5 h-2.5 text-xeoris-yellow/40" />
                                                        <span className="text-[9px] text-xeoris-yellow/60 italic truncate" title={p.scope}>{p.scope}</span>
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
