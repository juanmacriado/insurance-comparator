'use client';

import { ComparisonReport } from '@/lib/comparator';
import { Download, FileDown } from 'lucide-react';

interface PDFGeneratorProps {
    report: ComparisonReport;
    clientName?: string;
}

export function PDFGenerator({ report, clientName }: PDFGeneratorProps) {
    const generatePDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const numPolicies = report.policyNames.length;
        // Switch to landscape if many policies
        const orientation = numPolicies > 2 ? 'l' : 'p';
        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Header - Xeoris Professional Branding
        doc.setFillColor(10, 15, 20); // Deep Black/Blue
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setFillColor(255, 230, 0); // Xeoris Yellow Line
        doc.rect(0, 40, pageWidth, 1.5, 'F');

        doc.setTextColor(255, 230, 0);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        const mainTitle = clientName ? `Diferentes soluciones para ${clientName}` : "Comparativa de Propuestas Ciber";
        doc.text(mainTitle, pageWidth / 2, 22, { align: 'center' });

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Informe técnico elaborado por el motor de IA de Xeoris Global Risk`, pageWidth / 2, 32, { align: 'center' });

        // Table Data Construction
        const tableData = report.items.map(item => {
            const isPremium = item.category.toLowerCase().includes('prima');

            const policyCols = item.policies.map(p => {
                let text = p.details;
                if (!isPremium) {
                    if (p.amount !== "N/A") text += `\nLímite: ${p.amount}`;
                    if (p.deductible !== "N/A") text += `\nFranq: ${p.deductible}`;
                    if (p.scope !== "No especificado" && p.scope !== "No analizado") text += `\nÁmbito: ${p.scope}`;
                }
                return text;
            });

            return [item.category, ...policyCols];
        });

        // Determine font size based on number of columns
        // 1 column: 9pt, 2 cols: 8pt, 3 cols: 7pt, 5 cols: 6.5pt
        const bodyFontSize = numPolicies <= 1 ? 9 : numPolicies === 2 ? 8 : numPolicies === 3 ? 7.5 : 6.5;

        // AutoTable
        autoTable(doc, {
            startY: 50,
            head: [['Concepto', ...report.policyNames]],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [10, 15, 20],
                textColor: [255, 230, 0],
                fontStyle: 'bold',
                fontSize: bodyFontSize + 1,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: bodyFontSize,
                cellPadding: 3,
                textColor: [40, 40, 40],
                valign: 'top',
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: orientation === 'l' ? 45 : 35, fontStyle: 'bold', fillColor: [250, 250, 250] }
            },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            },
            margin: { left: 10, right: 10, bottom: 20 }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            const footerText = 'Xeoris.com - Tecnología Avanzada para la Transferencia de Ciberriesgos';
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        }

        const fileName = clientName
            ? `Diferentes-soluciones-${clientName.replace(/\s+/g, '-')}.pdf`
            : 'comparativa-xeoris.pdf';
        doc.save(fileName);
    };

    return (
        <div className="flex justify-center mt-12 pb-16">
            <button
                onClick={generatePDF}
                className="flex items-center gap-3 bg-xeoris-yellow text-xeoris-blue hover:bg-yellow-400 font-black py-5 px-12 rounded-2xl shadow-[0_15px_45px_rgba(255,230,0,0.3)] transition-all hover:scale-105 active:scale-95 group"
            >
                <div className="bg-xeoris-blue/10 p-2 rounded-lg group-hover:bg-xeoris-blue/20 transition-colors">
                    <FileDown className="w-6 h-6" />
                </div>
                <div>
                    <span className="block text-[10px] uppercase tracking-widest opacity-60 leading-none mb-1">Descargar Resultado</span>
                    <span className="text-lg">Generar Informe Profesional PDF</span>
                </div>
            </button>
        </div>
    );
}
