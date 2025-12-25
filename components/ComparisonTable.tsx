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
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-12">
            {/* Dark Professional Header */}
            <div className="bg-slate-900 p-8 text-white relative border-b border-yellow-400/50">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tighter">{title}</h2>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <div className="h-1 w-10 bg-yellow-400 rounded-full"></div>
                            <p className="text-slate-400 text-xs uppercase tracking-[0.2em] font-black">Powered by Xeoris Global Risk AI</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-6 font-black text-slate-400 uppercase tracking-widest text-[10px] w-64">Concepto / Cobertura</th>
                            {report.policyNames.map((name, i) => (
                                <th key={i} className="p-6 font-black text-slate-900 border-l border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-900 text-yellow-400 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-inner">
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
                                    "border-b border-slate-100 transition-colors group",
                                    isPremiumRow ? "bg-yellow-50/50" : "hover:bg-slate-50/80"
                                )}>
                                    <td className="p-6 bg-slate-50/30">
                                        <div className="flex items-center gap-3">
                                            {!isPremiumRow && <Shield className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />}
                                            <span className={cn(
                                                "font-black text-xs block uppercase tracking-tight",
                                                isPremiumRow ? "text-slate-900 underline decoration-yellow-400 decoration-2" : "text-slate-600"
                                            )}>
                                                {item.category}
                                            </span>
                                        </div>
                                    </td>

                                    {item.policies.map((p, pIdx) => (
                                        <td key={pIdx} className="p-6 border-l border-slate-200 relative align-top">
                                            {p.isWinner && (
                                                <div className="absolute top-4 right-4 bg-slate-900 p-1.5 rounded-full border border-yellow-400/30 shadow-md">
                                                    <Check className="w-3 h-3 text-yellow-400" />
                                                </div>
                                            )}

                                            <p className="text-sm text-slate-900 leading-relaxed font-medium mb-6">
                                                {p.details}
                                            </p>

                                            <div className="space-y-3">
                                                {p.amount !== "N/A" && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Límite Máximo:</span>
                                                        <span className="text-slate-900 font-black text-xs bg-yellow-400/20 px-3 py-1 rounded-md border border-yellow-400/30">
                                                            {p.amount}
                                                        </span>
                                                    </div>
                                                )}
                                                {p.deductible !== "N/A" && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Franquicia:</span>
                                                        <span className="text-[11px] font-black text-slate-800">{p.deductible}</span>
                                                    </div>
                                                )}
                                                {p.scope !== "No especificado" && p.scope !== "No analizado" && (
                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                                        <MapPin className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] text-slate-500 italic truncate font-bold" title={p.scope}>{p.scope}</span>
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
