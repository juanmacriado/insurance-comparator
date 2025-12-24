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

        // Header
        doc.setFillColor(22, 48, 58); // #16303A Xeoris Blue
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("Informe Comparativo de Seguros", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        doc.text(`Generado por Xeoris Comparator`, 105, 30, { align: 'center' });

        // Summary
        doc.setTextColor(22, 48, 58);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Resumen Ejecutivo:", 14, 50);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const winnerText = report.overallWinner === 1 ? file1Name :
            report.overallWinner === 2 ? file2Name : "Empate";

        doc.text(`El análisis determina que la mejor opción es: ${winnerText}`, 14, 60);

        // Table
        const tableData = report.items.map(item => {
            let p1Text = item.policy1Details + (item.betterPolicy === 1 ? ' (MEJOR)' : '');
            if (item.policy1Amount !== "N/A") p1Text += `\nLímite de indemnización: ${item.policy1Amount}`;
            if (item.policy1Deductible !== "N/A") p1Text += `\nFranquicia: ${item.policy1Deductible}`;

            let p2Text = item.policy2Details + (item.betterPolicy === 2 ? ' (MEJOR)' : '');
            if (item.policy2Amount !== "N/A") p2Text += `\nLímite de indemnización: ${item.policy2Amount}`;
            if (item.policy2Deductible !== "N/A") p2Text += `\nFranquicia: ${item.policy2Deductible}`;

            return [item.category, p1Text, p2Text];
        });

        autoTable(doc, {
            startY: 70,
            head: [['Criterio', file1Name, file2Name]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [22, 48, 58], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 3 },
            alternateRowStyles: { fillColor: [243, 244, 246] }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('Generado automáticamente por Xeoris.com', 105, 290, { align: 'center' });
        }

        doc.save('comparativa-xeoris.pdf');
    };

    return (
        <div className="flex justify-center mt-8 pb-12">
            <button
                onClick={generatePDF}
                className="flex items-center gap-2 bg-xeoris-yellow text-xeoris-blue hover:bg-yellow-400 font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
            >
                <Download className="w-5 h-5" />
                Descargar Informe PDF
            </button>
        </div>
    );
}
