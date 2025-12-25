import { PolicyAnalysis, CoverageCategories } from "./ai-analyzer";

export interface ComparisonResult {
    category: string;
    policies: {
        details: string;
        amount: string;
        deductible: string;
        scope: string;
        isWinner?: boolean;
    }[];
}

export interface ComparisonReport {
    items: ComparisonResult[];
    policyNames: string[];
}

// Fallback logic for extraction (Classic Path - partially legacy now but keeping for safety)
const CATEGORIES = [
    { key: ['respuesta', 'incidente', 'asistencia', 'servicio'], label: 'Servicios de Respuesta a incidentes' },
    { key: ['mitigación', 'minoración', 'contención'], label: 'Gastos de Mitigación' },
    { key: ['paralización', 'lucro', 'cesante', 'pérdida de beneficios'], label: 'Pérdida de Beneficios' },
    { key: ['extorsión', 'ransomware', 'secuestro'], label: 'Extorsión Cibernética' },
    { key: ['datos', 'restauración', 'recuperación', 'reconstitución'], label: 'Gastos de Recuperación de Datos y Sistemas' },
    { key: ['equipos', 'hardware', 'daños materiales'], label: 'Protección de Equipos' },
    { key: ['civil', 'tecnológica', 'rc', 'terceros'], label: 'Responsabilidad Tecnológica / Responsabilidad Civil' },
    { key: ['fraude', 'phishing', 'transferencia'], label: 'Fraude Tecnológico' },
    { key: ['ecrime', 'identidad', 'suplantación'], label: 'Ecrime / Suplantación de Identidad' }
];

export function compareAIAnalyses(analyses: PolicyAnalysis[], policyNames: string[]): ComparisonReport {
    const items: ComparisonResult[] = [];

    // 1. Process coverage items
    CoverageCategories.forEach(cat => {
        const policyNodes = analyses.map(analysis => {
            const coverage = analysis.coverages.find(c => c.category === cat);
            return {
                details: coverage?.isPresent ? (coverage.details || "Incluida") : "No mencionado",
                amount: coverage?.amount || "N/A",
                deductible: coverage?.deductible || "N/A",
                scope: coverage?.scope || "No especificado"
            };
        });

        items.push({
            category: cat as string,
            policies: policyNodes
        });
    });

    // 2. Add Premium rows
    const netPremiums = analyses.map(a => ({
        details: `Importe Neto: ${a.netPremium || "N/A"}`,
        amount: a.netPremium || "N/A",
        deductible: "N/A",
        scope: "Pago Anual"
    }));
    items.push({ category: "Prima Neta", policies: netPremiums });

    const totalPremiums = analyses.map(a => ({
        details: `Importe Total: ${a.totalPremium || "N/A"}`,
        amount: a.totalPremium || "N/A",
        deductible: "N/A",
        scope: "Importe con Impuestos"
    }));
    items.push({ category: "Prima Total", policies: totalPremiums });

    return {
        items,
        policyNames
    };
}
