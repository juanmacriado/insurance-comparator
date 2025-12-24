import { ComparisonResult, ComparisonReport } from "@/lib/comparator";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
    report: ComparisonReport;
    file1Name: string;
    file2Name: string;
}

export function ComparisonTable({ report, file1Name, file2Name }: ComparisonTableProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-8">
            <div className="bg-xeoris-blue p-6 text-white text-center">
                <h2 className="text-2xl font-bold mb-2">Resultados del Análisis</h2>
                <p className="opacity-90">
                    Ganador General: {
                        report.overallWinner === 1 ? file1Name :
                            report.overallWinner === 2 ? file2Name :
                                "Empate técnico"
                    }
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-700">Cobertura / Criterio</th>
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
                                <td className="p-4 font-medium text-gray-800">{item.category}</td>

                                {/* Policy 1 Cell */}
                                <td className={cn("p-4 border-l border-gray-100 relative", item.betterPolicy === 1 && "bg-blue-50/50")}>
                                    {item.betterPolicy === 1 && (
                                        <div className="absolute top-2 right-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 mb-1">{item.policy1Details}</p>
                                    {item.policy1Amount !== "N/A" && (
                                        <p className="text-xs font-semibold text-gray-800">Límite de indemnización: {item.policy1Amount}</p>
                                    )}
                                    {item.policy1Deductible !== "N/A" && (
                                        <p className="text-xs text-gray-500">Franquicia: {item.policy1Deductible}</p>
                                    )}
                                </td>

                                {/* Policy 2 Cell */}
                                <td className={cn("p-4 border-l border-gray-100 relative", item.betterPolicy === 2 && "bg-blue-50/50")}>
                                    {item.betterPolicy === 2 && (
                                        <div className="absolute top-2 right-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 mb-1">{item.policy2Details}</p>
                                    {item.policy2Amount !== "N/A" && (
                                        <p className="text-xs font-semibold text-gray-800">Límite de indemnización: {item.policy2Amount}</p>
                                    )}
                                    {item.policy2Deductible !== "N/A" && (
                                        <p className="text-xs text-gray-500">Franquicia: {item.policy2Deductible}</p>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
