import { ComparisonResult, ComparisonReport } from "@/lib/comparator";
import { Check, Info, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
    report: ComparisonReport;
    file1Name: string;
    file2Name: string;
}

export function ComparisonTable({ report, file1Name, file2Name }: ComparisonTableProps) {
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-8">
            <div className="bg-xeoris-blue p-8 text-white">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold mb-1">Resultados del Análisis IA</h2>
                        <p className="opacity-80 text-sm">Comparativa detallada con 9 bloques de cobertura</p>
                    </div>
                    <div className="bg-xeoris-yellow text-xeoris-blue px-6 py-2 rounded-full font-bold shadow-lg">
                        Ganador: {
                            report.overallWinner === 1 ? file1Name :
                                report.overallWinner === 2 ? file2Name :
                                    "Empate Técnico"
                        }
                    </div>
                </div>

                {/* Premiums Section */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
                    <div className="text-center">
                        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Primas {file1Name}</p>
                        <div className="flex flex-col gap-1 text-xeoris-yellow">
                            <span className="text-xl font-bold">{report.policy1PremiumTotal !== "N/A" ? report.policy1PremiumTotal : "Incluida"} <span className="text-xs opacity-70">Total</span></span>
                            <span className="text-sm opacity-90">{report.policy1PremiumNet !== "N/A" ? `Neto: ${report.policy1PremiumNet}` : ""}</span>
                        </div>
                    </div>
                    <div className="text-center border-l border-white/10">
                        <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Primas {file2Name}</p>
                        <div className="flex flex-col gap-1 text-xeoris-yellow">
                            <span className="text-xl font-bold">{report.policy2PremiumTotal !== "N/A" ? report.policy2PremiumTotal : "Incluida"} <span className="text-xs opacity-70">Total</span></span>
                            <span className="text-sm opacity-90">{report.policy2PremiumNet !== "N/A" ? `Neto: ${report.policy2PremiumNet}` : ""}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-700 w-1/4">Cobertura / Criterio</th>
                            <th className={cn("p-4 font-semibold", report.overallWinner === 1 ? "text-xeoris-blue" : "text-gray-700")}>
                                {file1Name}
                            </th>
                            <th className={cn("p-4 font-semibold", report.overallWinner === 2 ? "text-xeoris-blue" : "text-gray-700")}>
                                {file2Name}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-800">
                                    {item.category}
                                    <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Analizado por IA</div>
                                </td>

                                {/* Policy 1 Cell */}
                                <td className={cn("p-4 border-l border-gray-100 relative", item.betterPolicy === 1 && "bg-blue-50/10")}>
                                    {item.betterPolicy === 1 && (
                                        <div className="absolute top-4 right-4 bg-green-100 p-1 rounded-full">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-3 hover:line-clamp-none transition-all">{item.policy1Details}</p>

                                    <div className="space-y-1 mt-2">
                                        {item.policy1Amount !== "N/A" && (
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="font-bold text-gray-700">Límite:</span>
                                                <span className="text-xeoris-blue font-bold bg-blue-50 px-1.5 py-0.5 rounded">{item.policy1Amount}</span>
                                            </div>
                                        )}
                                        {item.policy1Deductible !== "N/A" && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <span className="font-medium">Franquicia:</span>
                                                <span>{item.policy1Deductible}</span>
                                            </div>
                                        )}
                                        {item.policy1Scope !== "No especificado" && item.policy1Scope !== "No analizado" && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 italic">
                                                <MapPin className="w-3 h-3" />
                                                <span>{item.policy1Scope}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* Policy 2 Cell */}
                                <td className={cn("p-4 border-l border-gray-100 relative", item.betterPolicy === 2 && "bg-blue-50/10")}>
                                    {item.betterPolicy === 2 && (
                                        <div className="absolute top-4 right-4 bg-green-100 p-1 rounded-full">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-3 hover:line-clamp-none transition-all">{item.policy2Details}</p>

                                    <div className="space-y-1 mt-2">
                                        {item.policy2Amount !== "N/A" && (
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="font-bold text-gray-700">Límite:</span>
                                                <span className="text-xeoris-blue font-bold bg-blue-50 px-1.5 py-0.5 rounded">{item.policy2Amount}</span>
                                            </div>
                                        )}
                                        {item.policy2Deductible !== "N/A" && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <span className="font-medium">Franquicia:</span>
                                                <span>{item.policy2Deductible}</span>
                                            </div>
                                        )}
                                        {item.policy2Scope !== "No especificado" && item.policy2Scope !== "No analizado" && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 italic">
                                                <MapPin className="w-3 h-3" />
                                                <span>{item.policy2Scope}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
