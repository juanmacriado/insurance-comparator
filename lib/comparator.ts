import { PolicyAnalysis, CoverageCategories } from "./ai-analyzer";

export interface ComparisonResult {
    category: string;
    policy1Details: string;
    policy2Details: string;
    policy1Amount: string;
    policy1Deductible: string;
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

// Keywords to look for (Classic Path) - Updated for fallback
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

    // Look for deductible
    let deductible = "N/A";
    const franIndex = window.toLowerCase().indexOf('franquicia');
    if (franIndex !== -1) {
        const match = window.substring(franIndex).match(MONEY_REGEX);
        if (match) deductible = match[0];
    }

    // Look for Limit
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

    if (amount === "N/A") {
        const matches = window.match(MONEY_REGEX);
        if (matches) {
            const val = matches.find(m => m !== deductible);
            if (val) amount = val;
        }
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
            policy1Details: p1Has ? "Cobertura detectada." : "No detectada.",
            policy2Details: p2Has ? "Cobertura detectada." : "No detectada.",
            policy1Amount: v1.amount,
            policy1Deductible: v1.deductible,
            policy2Amount: v2.amount,
            policy2Deductible: v2.deductible,
            policy1Scope: "No analizado",
            policy2Scope: "No analizado",
            betterPolicy: better,
            reason: better === 'equal' ? "Similares" : (better === 1 ? "Mejor en Póliza 1" : "Mejor en Póliza 2")
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
            reason: better === 1 ? "La póliza 1 tiene mejor cobertura." :
                better === 2 ? "La póliza 2 tiene mejor cobertura." :
                    "Ambas pólizas son similares."
        });
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
