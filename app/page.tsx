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
  const [step, setStep] = useState(1);
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
        setLoadingMsg(`Procesando documento ${i + 1}...`);
        const formData = new FormData();
        formData.append('file', validFiles[i]);
        const text = await extractTextAction(formData);
        extractedTexts.push(text);
        Names.push(validFiles[i].name);
      }

      setLoadingMsg("AI Analizando Coberturas...");
      const result = await compareTextsAction(extractedTexts, Names);
      setReport(result);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error crítico.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-yellow-400 selection:text-black">
      {/* Soft Background Accent */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-100 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-100 rounded-full blur-[80px] -ml-32 -mb-32"></div>
      </div>

      <div className="container mx-auto px-6 py-16 relative z-10 max-w-6xl">
        {/* Simple Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="bg-slate-900 p-4 rounded-2xl mb-6 shadow-lg">
            <ShieldCheck className="w-12 h-12 text-yellow-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-2 tracking-tighter text-slate-900 text-center">
            XEORIS <span className="bg-yellow-400 px-3 py-1 rounded-xl text-slate-900">COMPARATOR</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-bold uppercase tracking-[0.2em] mt-2">
            Inteligencia Artificial para Ciberseguros
          </p>
        </div>

        {/* High Contrast Step Indicator */}
        <div className="flex justify-center mb-16">
          <div className="flex items-center gap-2 md:gap-4 bg-slate-100 p-3 rounded-2xl border border-slate-200">
            <StepDot num={1} active={step >= 1} label="Cliente" onClick={() => step > 1 && setStep(1)} />
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <StepDot num={2} active={step >= 2} label="Pólizas" onClick={() => step > 2 && setStep(2)} />
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <StepDot num={3} active={step >= 3} label="Resultado" />
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-10 bg-red-100 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl text-center font-bold">
            {error}
          </div>
        )}

        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-xl">
              <div className="space-y-10">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 italic">Información del Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre de la empresa..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-5 text-2xl focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 italic">Número de Comparativas</label>
                  <select
                    value={numPolicies}
                    onChange={(e) => setNumPolicies(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-6 text-2xl focus:outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer text-slate-900 font-black"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-white">{n} Propuesta{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={startUploading}
                  className="w-full bg-slate-900 text-yellow-400 font-black py-5 rounded-2xl text-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  Siguiente paso <ArrowRight className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD */}
        {step === 2 && !loading && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-2">Sube los documentos</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                Comparativa para <span className="text-slate-900 underline decoration-yellow-400 decoration-4">{clientName}</span>
              </p>
            </div>

            <FileUpload slots={numPolicies} onFilesSelected={handleFilesSelected} />

            <div className="flex justify-center flex-col items-center gap-6 mt-12">
              <button
                onClick={handleCompare}
                className="bg-yellow-400 text-slate-900 font-black py-6 px-20 rounded-2xl text-2xl hover:bg-yellow-500 transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100"
                disabled={files.filter(f => f !== null).length === 0}
              >
                Ejecutar Análisis
              </button>
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-900 text-sm font-black uppercase tracking-widest border-b border-transparent hover:border-slate-900 transition-all">Regresar</button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center py-24 animate-in fade-in">
            <Loader2 className="w-20 h-20 text-yellow-400 animate-spin mb-10" />
            <p className="text-3xl font-black text-slate-900 animate-pulse">{loadingMsg}</p>
            <p className="text-slate-400 mt-4 text-xs font-bold uppercase tracking-[0.5em]">Xeoris Global Risk AI</p>
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
                className="bg-slate-100 text-slate-900 hover:bg-slate-200 font-black py-4 px-12 rounded-2xl transition-all border border-slate-300 shadow-sm uppercase tracking-widest text-xs"
              >
                Hacer Nueva Comparativa
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
        "flex items-center gap-2 px-6 py-2 rounded-xl transition-all whitespace-nowrap",
        active ? "bg-slate-900 text-white font-black shadow-md" : "text-slate-400",
        onClick && !active && "hover:text-slate-900 hover:bg-white"
      )}
    >
      <span className={cn(
        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-black",
        active ? "bg-yellow-400 text-slate-900" : "bg-slate-200 text-slate-400"
      )}>{num}</span>
      <span className="text-xs uppercase tracking-tighter">{label}</span>
    </button>
  );
}
