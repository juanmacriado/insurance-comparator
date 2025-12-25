import { ComparisonResult, ComparisonReport } from "@/lib/comparator";
import { Check, Info, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
    report: ComparisonReport;
    file1Name: string;
    file2Name: string;
    clientName?: string;
}

export function ComparisonTable({ report, file1Name, file2Name, clientName }: ComparisonTableProps) {
    const title = clientName
        ? `Diferentes soluciones para ${clientName}`
        : "Resultados del Análisis Comparativo";

    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mt-8">
            {/* Header Section */}
            <div className="bg-xeoris-blue p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-xeoris-yellow transform rotate-45 translate-x-16 -translate-y-16 opacity-10"></div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-xeoris-yellow">{title}</h2>
                        <p className="opacity-70 text-sm font-medium uppercase tracking-widest">Informe generado por IA de Xeoris</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-5 font-bold text-xeoris-blue uppercase tracking-tighter text-xs w-1/4">Cobertura / Detalle</th>
                            <th className="p-5 font-bold text-xeoris-blue">
                                <span className="block text-[10px] opacity-50 uppercase mb-1">Póliza 1</span>
                                {file1Name}
                            </th>
                            <th className="p-5 font-bold text-xeoris-blue">
                                <span className="block text-[10px] opacity-50 uppercase mb-1">Póliza 2</span>
                                {file2Name}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.items.map((item, idx) => {
                            const isPremiumRow = item.category.toLowerCase().includes('prima');

                            return (
                                <tr key={idx} className={cn(
                                    "border-b border-gray-100 transition-colors",
                                    isPremiumRow ? "bg-xeoris-yellow/5" : "hover:bg-gray-50"
                                )}>
                                    <td className="p-5">
                                        <span className={cn(
                                            "font-bold text-gray-800 block",
                                            isPremiumRow && "text-xeoris-blue"
                                        )}>
                                            {item.category}
                                        </span>
                                        {!isPremiumRow && (
                                            <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Análisis IA</div>
                                        )}
                                    </td>

                                    {/* Policy 1 Cell */}
                                    <td className={cn("p-5 border-l border-gray-100 relative", item.betterPolicy === 1 && "bg-blue-50/20")}>
                                        {item.betterPolicy === 1 && !isPremiumRow && (
                                            <div className="absolute top-4 right-4 bg-green-100 p-1 rounded-full">
                                                <Check className="w-3 h-3 text-green-600" />
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{item.policy1Details}</p>

                                        <div className="space-y-1.5 mt-2">
                                            {item.policy1Amount !== "N/A" && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="font-bold text-gray-400 uppercase text-[9px]">Límite:</span>
                                                    <span className="text-xeoris-blue font-extrabold bg-xeoris-yellow/10 px-2 py-0.5 rounded border border-xeoris-yellow/20">{item.policy1Amount}</span>
                                                </div>
                                            )}
                                            {item.policy1Deductible !== "N/A" && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="font-bold text-gray-400 uppercase text-[9px]">Franq:</span>
                                                    <span className="font-semibold">{item.policy1Deductible}</span>
                                                </div>
                                            )}
                                            {item.policy1Scope !== "No especificado" && item.policy1Scope !== "No analizado" && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-xeoris-blue font-medium bg-gray-100/50 px-2 py-1 rounded inline-flex">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    <span>{item.policy1Scope}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Policy 2 Cell */}
                                    <td className={cn("p-5 border-l border-gray-100 relative", item.betterPolicy === 2 && "bg-blue-50/20")}>
                                        {item.betterPolicy === 2 && !isPremiumRow && (
                                            <div className="absolute top-4 right-4 bg-green-100 p-1 rounded-full">
                                                <Check className="w-3 h-3 text-green-600" />
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{item.policy2Details}</p>

                                        <div className="space-y-1.5 mt-2">
                                            {item.policy2Amount !== "N/A" && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="font-bold text-gray-400 uppercase text-[9px]">Límite:</span>
                                                    <span className="text-xeoris-blue font-extrabold bg-xeoris-yellow/10 px-2 py-0.5 rounded border border-xeoris-yellow/20">{item.policy2Amount}</span>
                                                </div>
                                            )}
                                            {item.policy2Deductible !== "N/A" && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="font-bold text-gray-400 uppercase text-[9px]">Franq:</span>
                                                    <span className="font-semibold">{item.policy2Deductible}</span>
                                                </div>
                                            )}
                                            {item.policy2Scope !== "No especificado" && item.policy2Scope !== "No analizado" && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-xeoris-blue font-medium bg-gray-100/50 px-2 py-1 rounded inline-flex">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    <span>{item.policy2Scope}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
