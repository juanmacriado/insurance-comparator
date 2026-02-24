'use client';

import { ComparisonReport } from "@/lib/comparator";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

interface ExcelExportProps {
    report: ComparisonReport;
    clientName?: string;
}

export function ExcelExport({ report, clientName }: ExcelExportProps) {
    const downloadExcel = () => {
        // Prepare data for Excel
        // Prepare dynamic headers
        const headers = ["Cobertura / Concepto"];
        report.policyNames.forEach(name => {
            headers.push(`${name} - Límite`);
            headers.push(`${name} - Franquicia`);
            headers.push(`${name} - Detalles`);
        });

        // Rows data
        const rows = report.items.map(item => {
            const rowData: any = {
                "Cobertura / Concepto": item.category
            };

            report.policyNames.forEach((name, idx) => {
                const p = item.policies[idx];
                rowData[`${name} - Límite`] = p.amount;
                rowData[`${name} - Franquicia`] = p.deductible;
                rowData[`${name} - Detalles`] = p.details;
            });

            return rowData;
        });

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Comparativa");

        // Auto-size columns
        const maxWidths = headers.map(h => h.length);
        rows.forEach(row => {
            headers.forEach((h, i) => {
                const cellValue = String(row[h] || "");
                if (cellValue.length > maxWidths[i]) maxWidths[i] = cellValue.length;
            });
        });
        worksheet["!cols"] = maxWidths.map(w => ({ wch: Math.min(w + 2, 40) }));

        // Generate and download
        const fileName = `Comparativa_${clientName || 'Seguros'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg text-xs uppercase tracking-widest"
        >
            <FileSpreadsheet className="w-4 h-4" />
            Descargar Excel
        </button>
    );
}
