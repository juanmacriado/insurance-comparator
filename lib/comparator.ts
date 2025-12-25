import { PolicyAnalysis, CoverageCategories } from "./ai-analyzer";

export interface ComparisonResult {
    category: string;
    policy1Details: string;
    policy2Details: string;
    policy1Amount: string; // Used for Capital/Limit
    policy1Deductible: string; // Used for Franquicia
    policy2Amount: string;
    policy2Deductible: string;
    policy1Scope: string;
    policy2Scope: string;
    betterPolicy: 1 | 2 | 'equal';
    reason: string;
}

export interface ComparisonReport {
    overallWinner: 1 | 2 | 'draw';
    policy1PremiumNet: string;
    policy1PremiumTotal: string;
    policy2PremiumNet: string;
    policy2PremiumTotal: string;
    items: ComparisonResult[];
}

// Fallback logic for extraction (Classic Path)
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

const MONEY_REGEX = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(?:€|euros?|EUR)/gi;

function extractValues(text: string, keywords: string[]): { amount: string, deductible: string } {
    const lowerText = text.toLowerCase();
    let bestIndex = -1;

    for (const k of keywords) {
        const idx = lowerText.indexOf(k);
        if (idx !== -1) {
            bestIndex = idx;
            break;
        }
    }

    if (bestIndex === -1) return { amount: "N/A", deductible: "N/A" };

    const start = Math.max(0, bestIndex - 200);
    const end = Math.min(text.length, bestIndex + 1500);
    const window = text.substring(start, end);

    let deductible = "N/A";
    const franIndex = window.toLowerCase().indexOf('franquicia');
    if (franIndex !== -1) {
        const match = window.substring(franIndex).match(MONEY_REGEX);
        if (match) deductible = match[0];
    }

    let amount = "N/A";
    const limitTerms = ['límite', 'capital', 'suma asegurada', 'sublímite'];
    const searchArea = window.toLowerCase().substring(200);
    let bestLimitIndex = -1;

    for (const term of limitTerms) {
        const idx = searchArea.indexOf(term);
        if (idx !== -1 && (bestLimitIndex === -1 || idx < bestLimitIndex)) {
            bestLimitIndex = idx;
        }
    }

    if (bestLimitIndex !== -1) {
        const match = searchArea.substring(bestLimitIndex).match(MONEY_REGEX);
        if (match && match[0] !== deductible) amount = match[0];
    }

    return { amount, deductible };
}

export function comparePolicies(text1: string, text2: string): ComparisonReport {
    const items: ComparisonResult[] = [];
    let score1 = 0;
    let score2 = 0;

    CATEGORIES.forEach(cat => {
        const v1 = extractValues(text1, cat.key);
        const v2 = extractValues(text2, cat.key);
        const p1Has = v1.amount !== "N/A";
        const p2Has = v2.amount !== "N/A";

        let better: 1 | 2 | 'equal' = 'equal';
        if (p1Has && !p2Has) { better = 1; score1++; }
        else if (!p1Has && p2Has) { better = 2; score2++; }

        items.push({
            category: cat.label,
            policy1Details: p1Has ? "Detectada." : "No detectada.",
            policy2Details: p2Has ? "Detectada." : "No detectada.",
            policy1Amount: v1.amount,
            policy1Deductible: v1.deductible,
            policy2Amount: v2.amount,
            policy2Deductible: v2.deductible,
            policy1Scope: "No analizado",
            policy2Scope: "No analizado",
            betterPolicy: better,
            reason: "Análisis manual de texto."
        });
    });

    return {
        overallWinner: score1 > score2 ? 1 : score2 > score1 ? 2 : 'draw',
        policy1PremiumNet: "N/A",
        policy1PremiumTotal: "N/A",
        policy2PremiumNet: "N/A",
        policy2PremiumTotal: "N/A",
        items
    };
}

export function compareAIAnalyses(analysis1: PolicyAnalysis, analysis2: PolicyAnalysis): ComparisonReport {
    const items: ComparisonResult[] = [];
    let score1 = 0;
    let score2 = 0;

    // First, push coverage items
    CoverageCategories.forEach(cat => {
        const c1 = analysis1.coverages.find(c => c.category === cat);
        const c2 = analysis2.coverages.find(c => c.category === cat);

        const p1Has = c1?.isPresent || false;
        const p2Has = c2?.isPresent || false;

        let better: 1 | 2 | 'equal' = 'equal';
        if (p1Has && !p2Has) { better = 1; score1++; }
        else if (!p1Has && p2Has) { better = 2; score2++; }

        items.push({
            category: cat as string,
            policy1Details: c1?.details || "No mencionado.",
            policy2Details: c2?.details || "No mencionado.",
            policy1Amount: c1?.amount || "N/A",
            policy1Deductible: c1?.deductible || "N/A",
            policy2Amount: c2?.amount || "N/A",
            policy2Deductible: c2?.deductible || "N/A",
            policy1Scope: c1?.scope || "No especificado",
            policy2Scope: c2?.scope || "No especificado",
            betterPolicy: better,
            reason: ""
        });
    });

    // Add Premium rows at the end to be included in the same table
    items.push({
        category: "Prima Neta",
        policy1Details: `Importe Neto: ${analysis1.netPremium || "N/A"}`,
        policy2Details: `Importe Neto: ${analysis2.netPremium || "N/A"}`,
        policy1Amount: analysis1.netPremium || "N/A",
        policy1Deductible: "N/A",
        policy2Amount: analysis2.netPremium || "N/A",
        policy2Deductible: "N/A",
        policy1Scope: "Pago Único/Anual",
        policy2Scope: "Pago Único/Anual",
        betterPolicy: 'equal',
        reason: "Comparativa de costes netos."
    });

    items.push({
        category: "Prima Total (Impuestos Inc.)",
        policy1Details: `Importe Total: ${analysis1.totalPremium || "N/A"}`,
        policy2Details: `Importe Total: ${analysis1.totalPremium || "N/A"}`,
        policy1Amount: analysis1.totalPremium || "N/A",
        policy1Deductible: "N/A",
        policy2Amount: analysis2.totalPremium || "N/A",
        policy2Deductible: "N/A",
        policy1Scope: "Importe final al cliente",
        policy2Scope: "Importe final al cliente",
        betterPolicy: 'equal',
        reason: "Coste total de la inversión."
    });

    return {
        overallWinner: score1 > score2 ? 1 : score2 > score1 ? 2 : 'draw',
        policy1PremiumNet: analysis1.netPremium || "N/A",
        policy1PremiumTotal: analysis1.totalPremium || "N/A",
        policy2PremiumNet: analysis2.netPremium || "N/A",
        policy2PremiumTotal: analysis2.totalPremium || "N/A",
        items
    };
}
