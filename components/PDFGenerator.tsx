'use client';

import { ComparisonReport } from '@/lib/comparator';
import { Download } from 'lucide-react';

interface PDFGeneratorProps {
    report: ComparisonReport;
    file1Name: string;
    file2Name: string;
    clientName?: string;
}

export function PDFGenerator({ report, file1Name, file2Name, clientName }: PDFGeneratorProps) {
    const generatePDF = async () => {
        // Dynamic import to avoid SSR issues
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();

        // Header - Xeoris Colors
        doc.setFillColor(22, 48, 58); // Dark Blue
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFillColor(255, 230, 0); // Yellow Accent Line
        doc.rect(0, 40, 210, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        const mainTitle = clientName ? `Diferentes soluciones para ${clientName}` : "Comparativa de Soluciones Ciber";
        doc.text(mainTitle, 105, 25, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Análisis técnico y comparativa de coberturas by Xeoris.com`, 105, 33, { align: 'center' });

        // Removed Executive Summary / Winner section as requested.
        // Starting directly with the table.

        // Table Data Preparation
        const tableData = report.items.map(item => {
            const isPremium = item.category.toLowerCase().includes('prima');

            let p1 = item.policy1Details;
            if (!isPremium) {
                if (item.policy1Amount !== "N/A") p1 += `\nLímite: ${item.policy1Amount}`;
                if (item.policy1Deductible !== "N/A") p1 += `\nFranq: ${item.policy1Deductible}`;
                if (item.policy1Scope !== "No especificado" && item.policy1Scope !== "No analizado") p1 += `\nÁmbito: ${item.policy1Scope}`;
                if (item.betterPolicy === 1) p1 += `\n[MÁS FAVORABLE]`;
            }

            let p2 = item.policy2Details;
            if (!isPremium) {
                if (item.policy2Amount !== "N/A") p2 += `\nLímite: ${item.policy2Amount}`;
                if (item.policy2Deductible !== "N/A") p2 += `\nFranq: ${item.policy2Deductible}`;
                if (item.policy2Scope !== "No especificado" && item.policy2Scope !== "No analizado") p2 += `\nÁmbito: ${item.policy2Scope}`;
                if (item.betterPolicy === 2) p2 += `\n[MÁS FAVORABLE]`;
            }

            return [item.category, p1, p2];
        });

        // Generate Table
        autoTable(doc, {
            startY: 55,
            head: [['Concepto / Cobertura', file1Name, file2Name]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [22, 48, 58], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, cellPadding: 4, textColor: [50, 50, 50] },
            columnStyles: {
                0: { cellWidth: 40, fontStyle: 'bold', fillColor: [250, 250, 250] }
            },
            alternateRowStyles: { fillColor: [255, 255, 255] }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            const footerText = 'Informe profesional generado por Xeoris.com - Especialistas en Gestión de Ciberriesgos';
            doc.text(footerText, 105, 285, { align: 'center' });
            doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        }

        const fileName = clientName ? `Diferentes-soluciones-${clientName.replace(/\s+/g, '-')}.pdf` : 'comparativa-xeoris.pdf';
        doc.save(fileName);
    };

    return (
        <div className="flex justify-center mt-12 pb-16">
            <button
                onClick={generatePDF}
                className="flex items-center gap-2 bg-xeoris-blue text-xeoris-yellow hover:bg-slate-800 font-bold py-4 px-10 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 border-2 border-xeoris-yellow"
            >
                <Download className="w-5 h-5" />
                Descargar Informe: {clientName ? `Soluciones ${clientName}` : "PDF Xeoris"}
            </button>
        </div>
    );
}
