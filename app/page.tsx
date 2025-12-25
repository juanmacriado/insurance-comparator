'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ComparisonTable } from '@/components/ComparisonTable';
import { PDFGenerator } from '@/components/PDFGenerator';
import { extractTextAction, compareTextsAction } from './actions';
import { ComparisonReport } from '@/lib/comparator';
import { Loader2, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [step, setStep] = useState(1); // 1: Config, 2: Upload, 3: Report
  const [clientName, setClientName] = useState("");
  const [numPolicies, setNumPolicies] = useState(2);
  const [files, setFiles] = useState<(File | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startUploading = () => {
    if (!clientName.trim()) {
      setError("Por favor, introduce el nombre de la empresa/cliente.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFilesSelected = (selectedFiles: (File | null)[]) => {
    setFiles(selectedFiles);
    setError(null);
  };

  const handleCompare = async () => {
    const validFiles = files.filter(f => f !== null) as File[];
    if (validFiles.length < 1) {
      setError("Sube al menos una póliza para analizar.");
      return;
    }

    setLoading(true);
    setReport(null);
    setError(null);

    try {
      const extractedTexts: string[] = [];
      const Names: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        setLoadingMsg(`Leyendo documento ${i + 1} de ${validFiles.length}...`);
        const formData = new FormData();
        formData.append('file', validFiles[i]);
        const text = await extractTextAction(formData);
        extractedTexts.push(text);
        Names.push(validFiles[i].name);
      }

      setLoadingMsg("Analizando con Inteligencia Artificial...");
      const result = await compareTextsAction(extractedTexts, Names);
      setReport(result);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f14] text-gray-200 selection:bg-xeoris-yellow selection:text-xeoris-blue">
      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden h-screen opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-xeoris-yellow/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[50%] bg-xeoris-blue/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="bg-xeoris-yellow p-3 rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,230,0,0.3)]">
            <ShieldCheck className="w-12 h-12 text-xeoris-blue" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter text-white">
            XEORIS <span className="text-xeoris-yellow">COMPARATOR</span>
          </h1>
          <p className="text-gray-400 text-lg uppercase tracking-[0.3em] font-bold">
            Inteligencia Artificial para Ciberseguros
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4 bg-gray-900/50 p-2 rounded-full border border-gray-800">
            <StepDot num={1} active={step >= 1} label="Cliente" onClick={() => step > 1 && setStep(1)} />
            <ChevronRight className="w-4 h-4 text-gray-700" />
            <StepDot num={2} active={step >= 2} label="Documentos" onClick={() => step > 2 && setStep(2)} />
            <ChevronRight className="w-4 h-4 text-gray-700" />
            <StepDot num={3} active={step >= 3} label="Análisis" />
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-900/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-2xl text-center text-sm animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}

        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-gray-900/40 border border-gray-800 p-8 rounded-3xl backdrop-blur-xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-xeoris-yellow uppercase tracking-widest mb-3">Nombre de la Empresa / Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Multinacional Tecnológica S.A."
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-6 py-4 text-xl focus:outline-none focus:border-xeoris-yellow focus:ring-1 focus:ring-xeoris-yellow transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-xeoris-yellow uppercase tracking-widest mb-3">Número de Propuestas a Comparar</label>
                  <select
                    value={numPolicies}
                    onChange={(e) => setNumPolicies(parseInt(e.target.value))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-6 py-4 text-xl focus:outline-none focus:border-xeoris-yellow transition-all appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-gray-900">{n} Propuesta{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={startUploading}
                  className="w-full bg-xeoris-yellow text-xeoris-blue font-black py-4 rounded-2xl text-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 group shadow-[0_10px_40px_rgba(255,230,0,0.15)]"
                >
                  Continuar <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD */}
        {step === 2 && !loading && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-2">Sube tus documentos</h2>
              <p className="text-gray-400">Preparando comparativa para <span className="text-xeoris-yellow font-bold">{clientName}</span> ({numPolicies} ofertas)</p>
            </div>

            <FileUpload slots={numPolicies} onFilesSelected={handleFilesSelected} />

            <div className="flex justify-center flex-col items-center gap-4 mt-8">
              <button
                onClick={handleCompare}
                className="bg-xeoris-yellow text-xeoris-blue font-black py-4 px-12 rounded-2xl text-xl hover:bg-yellow-400 transition-all shadow-[0_10px_40px_rgba(255,230,0,0.2)] disabled:opacity-50"
                disabled={files.filter(f => f !== null).length === 0}
              >
                Analizar Coberturas
              </button>
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-xeoris-yellow text-sm font-bold uppercase tracking-widest">Atrás</button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center py-20 animate-in fade-in">
            <div className="relative mb-8">
              <Loader2 className="w-20 h-20 text-xeoris-yellow animate-spin" />
              <div className="absolute inset-0 bg-xeoris-yellow/20 rounded-full blur-2xl"></div>
            </div>
            <p className="text-2xl font-bold text-white animate-pulse">{loadingMsg}</p>
            <p className="text-gray-500 mt-4 text-sm">Esto puede tardar unos segundos dependiendo del volumen del PDF.</p>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 3 && report && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            <ComparisonTable report={report} clientName={clientName} />
            <PDFGenerator report={report} clientName={clientName} />

            <div className="flex justify-center mt-12 mb-20">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-800 text-white hover:bg-gray-700 font-bold py-3 px-8 rounded-full transition-all border border-gray-700"
              >
                Nueva Comparativa
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StepDot({ num, active, label, onClick }: { num: number, active: boolean, label: string, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all whitespace-nowrap",
        active ? "bg-xeoris-yellow text-xeoris-blue font-bold shadow-lg" : "text-gray-500",
        onClick && !active && "hover:text-gray-300"
      )}
    >
      <span className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
        active ? "bg-xeoris-blue text-xeoris-yellow" : "bg-gray-800 text-gray-500"
      )}>{num}</span>
      <span className="text-xs uppercase tracking-tight">{label}</span>
    </button>
  );
}
