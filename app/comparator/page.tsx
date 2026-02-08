'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ComparisonTable } from '@/components/ComparisonTable';
import { PDFGenerator } from '@/components/PDFGenerator';
import { extractTextAction, compareTextsAction } from '../actions';
import { ComparisonReport } from '@/lib/comparator';
import { Loader2, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
      setError(err instanceof Error ? err.message : "Error Crítico.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen text-slate-800 dark:text-slate-100 overflow-x-hidden">
      {/* Background Graphic elements are handled by body/layout */}

      {/* Brand Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-200 dark:border-slate-800 py-4 transition-colors duration-300">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-primary p-2 rounded-xl shadow-lg">
              <ShieldCheck className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-primary dark:text-white">XEORIS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Volver al Portal
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 pt-32 pb-20 relative z-10 max-w-6xl">
        {/* Hero Section */}
        <div className="flex flex-col items-center mb-12 animate-in fade-in duration-1000">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight text-primary dark:text-white text-center leading-tight">
            Comparador <br />
            <span className="text-primary dark:text-indigo-950 bg-secondary px-6 py-2 rounded-full inline-block mt-2 shadow-lg glow-sm">Inteligente</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base uppercase tracking-[0.3em] font-bold text-center">
            Análisis de Pólizas con IA
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-16">
          <div className="flex items-center gap-2 md:gap-4 glass-card px-4 py-3 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <StepDot num={1} active={step >= 1} current={step === 1} label="Cliente" onClick={() => step > 1 && setStep(1)} />
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <StepDot num={2} active={step >= 2} current={step === 2} label="Pólizas" onClick={() => step > 2 && setStep(2)} />
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <StepDot num={3} active={step >= 3} current={step === 3} label="Resultado" />
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-10 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 px-8 py-5 rounded-2xl text-center font-bold shadow-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="glass-card p-12 rounded-3xl shadow-2xl flex flex-col items-center text-center border border-slate-200/50 dark:border-slate-700/50">
              <div className="space-y-12 w-full">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-4">Nombre del Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Indra Sistemas"
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-8 py-6 text-2xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all text-primary dark:text-white font-bold text-center placeholder-slate-300 dark:placeholder-slate-600 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-4">Número de Propuestas</label>
                  <select
                    value={numPolicies}
                    onChange={(e) => setNumPolicies(parseInt(e.target.value))}
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-8 py-7 text-3xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all appearance-none cursor-pointer text-primary dark:text-white font-bold text-center backdrop-blur-sm"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-white dark:bg-slate-800 text-primary dark:text-white">{n} Propuesta{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={startUploading}
                  className="w-full bg-primary hover:bg-indigo-900 text-white font-bold uppercase tracking-widest text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  Siguiente paso
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD */}
        {step === 2 && !loading && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold text-primary dark:text-white mb-2 tracking-tight">Carga de Documentos</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em]">
                Analizando <span className="text-primary dark:text-white border-b-2 border-secondary pb-1">{clientName}</span>
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
              <FileUpload slots={numPolicies} onFilesSelected={handleFilesSelected} />
            </div>

            <div className="flex justify-center flex-col items-center gap-6 mt-12">
              <button
                onClick={handleCompare}
                className="bg-primary hover:bg-indigo-900 text-white font-bold uppercase tracking-widest text-xl px-12 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                disabled={files.filter(f => f !== null).length === 0}
              >
                Analizar con IA
              </button>
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-primary dark:text-slate-500 dark:hover:text-white text-sm font-bold uppercase tracking-widest transition-all">
                Cancelar y Volver
              </button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center py-24 animate-in fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-full animate-pulse"></div>
              <Loader2 className="relative w-24 h-24 text-secondary animate-spin mb-10" />
            </div>
            <p className="text-3xl font-display font-bold text-primary dark:text-white animate-pulse tracking-tight">{loadingMsg}</p>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 3 && report && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="glass-card p-6 md:p-10 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden mb-12">
              <ComparisonTable report={report} clientName={clientName} />
            </div>

            <div className="glass-card p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-12">
              <PDFGenerator report={report} clientName={clientName} />
            </div>

            <div className="flex justify-center mt-12 mb-24">
              <button
                onClick={() => setStep(1)}
                className="bg-slate-900 dark:bg-white text-secondary dark:text-primary hover:bg-black dark:hover:bg-slate-200 font-bold py-5 px-16 rounded-xl transition-all shadow-xl uppercase tracking-widest text-sm"
              >
                Nueva Comparativa Global
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StepDot({ num, active, current, label, onClick }: { num: number, active: boolean, current: boolean, label: string, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-2 md:gap-3 px-4 py-2 rounded-full transition-all whitespace-nowrap",
        current ? "bg-primary text-white shadow-md transform scale-105" :
          active ? "bg-primary/10 text-primary dark:text-white" : "text-slate-400 dark:text-slate-600",
        onClick && !current && "hover:bg-primary/5 hover:text-primary dark:hover:text-white cursor-pointer"
      )}
    >
      <span className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
        current ? "bg-secondary text-primary" :
          active ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
      )}>{num}</span>
      <span className="text-[10px] uppercase tracking-widest font-bold hidden md:inline-block">{label}</span>
    </button>
  );
}
