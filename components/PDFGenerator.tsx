'use client';

import { ComparisonReport } from '@/lib/comparator';
import { Download } from 'lucide-react';

interface PDFGeneratorProps {
    report: ComparisonReport;
    file1Name: string;
    file2Name: string;
}

export function PDFGenerator({ report, file1Name, file2Name }: PDFGeneratorProps) {
    const generatePDF = async () => {
        // Dynamic import to avoid SSR issues
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();

        // Header - Dark Xeoris Blue
        doc.setFillColor(22, 48, 58); // #16303A
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("Comparativa de Ciberpólizas", 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Analizado con Inteligencia Artificial por Xeoris.com`, 105, 30, { align: 'center' });

        // Summary & Winner
        doc.setTextColor(22, 48, 58);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Resumen Ejecutivo:", 14, 60);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const winnerName = report.overallWinner === 1 ? file1Name : (report.overallWinner === 2 ? file2Name : "Empate técnico");
        doc.text(`La póliza ganadora según el análisis de coberturas es: `, 14, 70);
        doc.setFont('helvetica', 'bold');
        doc.text(winnerName, 95, 70);

        // Premiums Summary - NEW
        doc.setFillColor(243, 244, 246);
        doc.rect(14, 78, 182, 25, 'F');

        doc.setTextColor(22, 48, 58);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Primas ${file1Name}:`, 20, 86);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${report.policy1PremiumTotal} / Neta: ${report.policy1PremiumNet}`, 20, 92);

        doc.setFont('helvetica', 'bold');
        doc.text(`Primas ${file2Name}:`, 110, 86);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${report.policy2PremiumTotal} / Neta: ${report.policy2PremiumNet}`, 110, 92);

        // Table Data
        const tableData = report.items.map(item => {
            let p1 = item.policy1Details;
            if (item.policy1Amount !== "N/A") p1 += `\nLIM: ${item.policy1Amount}`;
            if (item.policy1Deductible !== "N/A") p1 += `\nFRANQ: ${item.policy1Deductible}`;
            if (item.policy1Scope !== "No especificado" && item.policy1Scope !== "No analizado") p1 += `\nAMBITO: ${item.policy1Scope}`;
            if (item.betterPolicy === 1) p1 += `\n[MEJOR OPCIÓN]`;

            let p2 = item.policy2Details;
            if (item.policy2Amount !== "N/A") p2 += `\nLIM: ${item.policy2Amount}`;
            if (item.policy2Deductible !== "N/A") p2 += `\nFRANQ: ${item.policy2Deductible}`;
            if (item.policy2Scope !== "No especificado" && item.policy2Scope !== "No analizado") p2 += `\nAMBITO: ${item.policy2Scope}`;
            if (item.betterPolicy === 2) p2 += `\n[MEJOR OPCIÓN]`;

            return [item.category, p1, p2];
        });

        autoTable(doc, {
            startY: 110,
            head: [['Bloque de Cobertura', file1Name, file2Name]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [22, 48, 58], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 40, fontStyle: 'bold' },
                1: { cellWidth: 71 },
                2: { cellWidth: 71 }
            },
            alternateRowStyles: { fillColor: [250, 250, 250] }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Este informe ha sido generado automáticamente para Xeoris.com. Los datos son orientativos.', 105, 285, { align: 'center' });
            doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        }

        doc.save(`comparativa-${file1Name}-vs-${file2Name}.pdf`);
    };

    return (
        <div className="flex justify-center mt-12 pb-16">
            <button
                onClick={generatePDF}
                className="flex items-center gap-2 bg-xeoris-yellow text-xeoris-blue hover:bg-yellow-400 font-bold py-4 px-10 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
            >
                <Download className="w-5 h-5" />
                Descargar Informe Personalizado PDF
            </button>
        </div>
    );
}
