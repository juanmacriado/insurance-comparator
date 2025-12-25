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
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden mb-16">
            {/* Header Block - Fixed Contrast */}
            <div className="bg-[#16313a] p-12 text-white relative border-b-2 border-[#ffe008]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter text-white uppercase italic leading-none">{title}</h2>
                        <div className="flex items-center gap-4 justify-center md:justify-start">
                            <div className="h-2 w-20 bg-[#ffe008] rounded-full"></div>
                            <p className="text-white/60 text-[10px] uppercase tracking-[0.4em] font-black">Estudio Comparativo | Xeoris Global Risk</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-8 font-black text-[#16313a]/30 uppercase tracking-[0.3em] text-[10px] w-64">Cobertura / Concepto</th>
                            {report.policyNames.map((name, i) => (
                                <th key={i} className="p-8 font-black text-[#16313a] border-l border-gray-100 bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-[#ffe008] text-[#16313a] w-12 h-12 rounded-[12px] flex items-center justify-center text-sm font-black shadow-lg">
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
                                    isPremiumRow ? "bg-[#ffe008]/10" : "hover:bg-gray-50/50"
                                )}>
                                    <td className="p-8 bg-gray-50/20">
                                        <div className="flex items-center gap-4">
                                            {!isPremiumRow && <Shield className="w-6 h-6 text-[#16313a]/5 group-hover:text-[#16313a]/30 transition-colors" />}
                                            <span className={cn(
                                                "font-black text-[11px] block uppercase tracking-widest leading-tight",
                                                isPremiumRow ? "text-[#16313a] py-1 px-3 bg-[#ffe008]/30 rounded-lg inline-block" : "text-[#16313a]"
                                            )}>
                                                {item.category}
                                            </span>
                                        </div>
                                    </td>

                                    {item.policies.map((p, pIdx) => (
                                        <td key={pIdx} className="p-8 border-l border-gray-100 relative align-top">
                                            {p.isWinner && (
                                                <div className="absolute top-6 right-6 bg-[#16313a] p-2 rounded-full shadow-xl border border-[#ffe008]/30">
                                                    <Check className="w-4 h-4 text-[#ffe008]" />
                                                </div>
                                            )}

                                            <p className="text-[15px] text-[#16313a]/80 leading-relaxed font-bold mb-8">
                                                {p.details}
                                            </p>

                                            <div className="space-y-5">
                                                {p.amount !== "N/A" && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[8px] font-black text-[#16313a]/20 uppercase tracking-[0.4em]">Suma Asegurada</span>
                                                        <span className="text-[#16313a] font-black text-sm bg-[#ffe008] px-5 py-2.5 rounded-[12px] shadow-md inline-block w-fit">
                                                            {p.amount}
                                                        </span>
                                                    </div>
                                                )}
                                                {p.deductible !== "N/A" && (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black text-[#16313a]/30 uppercase tracking-widest">Franquicia:</span>
                                                        <span className="text-[13px] font-black text-[#16313a] bg-white border border-gray-100 px-3 py-1 rounded-lg">{p.deductible}</span>
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
