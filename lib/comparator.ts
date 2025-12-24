export interface ComparisonResult {
    category: string;
    policy1Details: string;
    policy2Details: string;
    policy1Amount: string;
    policy1Deductible: string;
    policy2Amount: string;
    policy2Deductible: string;
    betterPolicy: 1 | 2 | 'equal';
    reason: string;
}

export interface ComparisonReport {
    overallWinner: 1 | 2 | 'draw';
    items: ComparisonResult[];
}

// Keywords to look for
const CATEGORIES = [
    { key: ['ransomware', 'extorsión', 'secuestro'], label: 'Cobertura Ransomware' },
    { key: ['civil', 'rc', 'terceros', 'demandas'], label: 'Responsabilidad Civil' },
    { key: ['fraude', 'phishing', 'suplantación', 'ingeniería social', 'ceo'], label: 'Fraude del CEO / Phishing' },
    { key: ['datos', 'restauración', 'recuperación', 'electrónicos'], label: 'Restauración de Datos' },
    { key: ['multas', 'sanciones', 'administr', 'pci'], label: 'Multas y Sanciones' },
    { key: ['paralización', 'lucro', 'cesante', 'interrupción'], label: 'Pérdida de Beneficios' },
    { key: ['incidente', 'brecha', 'forense', 'investigación'], label: 'Gestión de Incidentes' }
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

    // Increase window significantly: some policies have tables or long descriptions before the limits
    // Window: 200 chars before, 1500 chars after coverage keyword
    const start = Math.max(0, bestIndex - 200);
    const end = Math.min(text.length, bestIndex + 1500);
    const window = text.substring(start, end);
    const lowerWindow = window.toLowerCase();

    // Look for deductible ("franquicia")
    let deductible = "N/A";
    const franIndex = lowerWindow.indexOf('franquicia');
    if (franIndex !== -1) {
        // Look for money after "franquicia"
        const franText = window.substring(franIndex);
        const match = franText.match(MONEY_REGEX);
        if (match) deductible = match[0];
    }

    // Look for Limit specifically after the keyword (to avoid catching limits from previous sections)
    let amount = "N/A";
    const limitTerms = ['límite de indemnización', 'límite', 'capital', 'suma asegurada', 'sublímite'];

    // Find the relative index of the limit term within the window, but starting from the keyword location
    // Since window starts at bestIndex - 200, the keyword is at window[200]
    const searchArea = lowerWindow.substring(200);
    let bestLimitIndexInSearchArea = -1;
    let foundTerm = "";

    for (const term of limitTerms) {
        const idx = searchArea.indexOf(term);
        if (idx !== -1 && (bestLimitIndexInSearchArea === -1 || idx < bestLimitIndexInSearchArea)) {
            bestLimitIndexInSearchArea = idx;
            foundTerm = term;
        }
    }

    if (bestLimitIndexInSearchArea !== -1) {
        // Look for money immediately following the limit term
        const limitText = searchArea.substring(bestLimitIndexInSearchArea);
        const match = limitText.substring(0, 100).match(MONEY_REGEX); // Look in next 100 chars
        if (match && match[0] !== deductible) {
            amount = match[0];
        } else {
            // If not immediately after, try a slightly wider search after the term
            const matchWider = limitText.match(MONEY_REGEX);
            if (matchWider && matchWider[0] !== deductible) {
                amount = matchWider[0];
            }
        }
    }

    // Fallback: search for any money in the window that isn't the deductible
    if (amount === "N/A") {
        const matches = window.match(MONEY_REGEX);
        if (matches) {
            const val = matches.find(m => m !== deductible);
            if (val) amount = val;
            else if (matches[0] !== deductible) amount = matches[0];
        }
    }

    return { amount, deductible };
}

export function comparePolicies(text1: string, text2: string): ComparisonReport {
    const t1 = text1.toLowerCase();
    const t2 = text2.toLowerCase();

    const items: ComparisonResult[] = [];
    let score1 = 0;
    let score2 = 0;

    CATEGORIES.forEach(cat => {
        const p1Has = cat.key.some(k => t1.includes(k));
        const p2Has = cat.key.some(k => t2.includes(k));

        let better: 1 | 2 | 'equal' = 'equal';
        let p1Text = "No mencionado explícitamente.";
        let p2Text = "No mencionado explícitamente.";

        const v1 = extractValues(text1, cat.key);
        const v2 = extractValues(text2, cat.key);

        if (p1Has && !p2Has) {
            better = 1;
            score1++;
            p1Text = "Cobertura incluida.";
            p2Text = "No detectado en el documento.";
        } else if (!p1Has && p2Has) {
            better = 2;
            score2++;
            p1Text = "No detectado en el documento.";
            p2Text = "Cobertura incluida.";
        } else if (p1Has && p2Has) {
            better = 'equal';
            p1Text = "Cobertura mencionada.";
            p2Text = "Cobertura mencionada.";
        }

        items.push({
            category: cat.label,
            policy1Details: p1Text,
            policy2Details: p2Text,
            policy1Amount: v1.amount,
            policy1Deductible: v1.deductible,
            policy2Amount: v2.amount,
            policy2Deductible: v2.deductible,
            betterPolicy: better,
            reason: better === 1 ? "La póliza 1 incluye esta cobertura." :
                better === 2 ? "La póliza 2 destaca por incluir esta protección." :
                    "Ambas polizas son similares en este aspecto."
        });
    });

    return {
        overallWinner: score1 > score2 ? 1 : score2 > score1 ? 2 : 'draw',
        items
    };
}

// AI Integration
import { PolicyAnalysis } from "./ai-analyzer";

export function compareAIAnalyses(analysis1: PolicyAnalysis, analysis2: PolicyAnalysis): ComparisonReport {
    const items: ComparisonResult[] = [];
    let score1 = 0;
    let score2 = 0;

    const allCategories = [
        'Cobertura Ransomware',
        'Responsabilidad Civil',
        'Fraude del CEO / Phishing',
        'Restauración de Datos',
        'Multas y Sanciones',
        'Pérdida de Beneficios',
        'Gestión de Incidentes'
    ];

    allCategories.forEach(cat => {
        // Safe casting since strings match
        const c1 = analysis1.coverages.find(c => c.category === cat);
        const c2 = analysis2.coverages.find(c => c.category === cat);

        const p1Has = c1?.isPresent || false;
        const p2Has = c2?.isPresent || false;

        let better: 1 | 2 | 'equal' = 'equal';
        let p1Details = c1?.details || "No mencionado.";
        let p2Details = c2?.details || "No mencionado.";

        if (p1Has && !p2Has) {
            better = 1;
            score1++;
            if (!c1?.details || c1.details === "Not found") p1Details = "Cobertura incluida.";
            p2Details = "No detectado.";
        } else if (!p1Has && p2Has) {
            better = 2;
            score2++;
            p1Details = "No detectado.";
            if (!c2?.details || c2.details === "Not found") p2Details = "Cobertura incluida.";
        } else if (p1Has && p2Has) {
            better = 'equal';
        }

        items.push({
            category: cat,
            policy1Details: p1Details,
            policy2Details: p2Details,
            policy1Amount: c1?.amount || "N/A",
            policy1Deductible: c1?.deductible || "N/A",
            policy2Amount: c2?.amount || "N/A",
            policy2Deductible: c2?.deductible || "N/A",
            betterPolicy: better,
            reason: better === 1 ? "La póliza 1 tiene mejor cobertura detectada por IA." :
                better === 2 ? "La póliza 2 tiene mejor cobertura detectada por IA." :
                    "Ambas pólizas son similares."
        });
    });

    return {
        overallWinner: score1 > score2 ? 1 : score2 > score1 ? 2 : 'draw',
        items
    };
}
