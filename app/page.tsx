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
    <main className="min-h-screen bg-[#0a0f14] text-xeoris-yellow selection:bg-xeoris-yellow selection:text-[#16313a]">
      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden h-screen opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-xeoris-yellow/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[50%] bg-[#16313a]/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10 max-w-6xl font-bold">
        {/* Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="bg-xeoris-yellow p-4 rounded-3xl mb-6 shadow-[0_0_40px_rgba(255,224,8,0.3)]">
            <ShieldCheck className="w-16 h-16 text-[#16313a]" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tighter text-white">
            XEORIS <span className="text-xeoris-yellow">COMPARATOR</span>
          </h1>
          <p className="text-xeoris-yellow/80 text-xl uppercase tracking-[0.4em] font-black">
            Inteligencia Artificial para Ciberseguros
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-6 bg-gray-900/60 p-3 rounded-full border border-gray-800 backdrop-blur-md">
            <StepDot num={1} active={step >= 1} label="Cliente" onClick={() => step > 1 && setStep(1)} />
            <ChevronRight className="w-5 h-5 text-xeoris-yellow/20" />
            <StepDot num={2} active={step >= 2} label="Documentos" onClick={() => step > 2 && setStep(2)} />
            <ChevronRight className="w-5 h-5 text-xeoris-yellow/20" />
            <StepDot num={3} active={step >= 3} label="Análisis" />
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-950/40 border-2 border-red-500 text-xeoris-yellow px-8 py-5 rounded-3xl text-center text-sm font-black animate-in fade-in zoom-in-95 shadow-lg">
            {error}
          </div>
        )}

        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-gray-900/60 border-2 border-gray-800 p-10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-black text-xeoris-yellow uppercase tracking-[0.2em] mb-4 text-center">Nombre de la Empresa / Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Multinacional Tecnológica S.A."
                    className="w-full bg-black/40 border-2 border-gray-700 rounded-2xl px-8 py-5 text-2xl focus:outline-none focus:border-xeoris-yellow focus:ring-2 focus:ring-xeoris-yellow transition-all text-xeoris-yellow placeholder:text-xeoris-yellow/20 text-center font-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-xeoris-yellow uppercase tracking-[0.2em] mb-4 text-center">Número de Propuestas a Comparar</label>
                  <select
                    value={numPolicies}
                    onChange={(e) => setNumPolicies(parseInt(e.target.value))}
                    className="w-full bg-black/40 border-2 border-gray-700 rounded-2xl px-8 py-6 text-3xl focus:outline-none focus:border-xeoris-yellow transition-all appearance-none cursor-pointer text-xeoris-yellow text-center font-black"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-gray-900 text-xeoris-yellow">{n} Propuesta{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={startUploading}
                  className="w-full bg-xeoris-yellow text-[#16313a] font-black py-5 rounded-2xl text-2xl hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group shadow-[0_15px_50px_rgba(255,224,8,0.2)]"
                >
                  Continuar <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD */}
        {step === 2 && !loading && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Sube tus documentos</h2>
              <p className="text-xeoris-yellow/80 text-lg uppercase tracking-widest">
                Analizando <span className="text-xeoris-yellow font-black border-b-2 border-xeoris-yellow">{clientName}</span> | <span className="text-white">{numPolicies} ofertas</span>
              </p>
            </div>

            <FileUpload slots={numPolicies} onFilesSelected={handleFilesSelected} />

            <div className="flex justify-center flex-col items-center gap-6 mt-12">
              <button
                onClick={handleCompare}
                className="bg-xeoris-yellow text-[#16313a] font-black py-6 px-16 rounded-2xl text-2xl hover:bg-yellow-400 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-[0_20px_60px_rgba(255,224,8,0.25)] disabled:opacity-50 disabled:scale-100"
                disabled={files.filter(f => f !== null).length === 0}
              >
                Analizar Coberturas con IA
              </button>
              <button onClick={() => setStep(1)} className="text-xeoris-yellow/60 hover:text-xeoris-yellow text-sm font-black uppercase tracking-[0.3em] transition-all hover:bg-xeoris-yellow/5 px-6 py-2 rounded-full border border-xeoris-yellow/10">Atrás</button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center py-20 animate-in fade-in">
            <div className="relative mb-12">
              <Loader2 className="w-28 h-28 text-xeoris-yellow animate-spin" />
              <div className="absolute inset-0 bg-xeoris-yellow/30 rounded-full blur-[60px] animate-pulse"></div>
            </div>
            <p className="text-3xl font-black text-white animate-pulse tracking-tight">{loadingMsg}</p>
            <p className="text-xeoris-yellow/60 mt-6 text-sm font-black uppercase tracking-[0.5em]">Xeoris Cyber Intelligence Engine</p>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 3 && report && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            <ComparisonTable report={report} clientName={clientName} />
            <PDFGenerator report={report} clientName={clientName} />

            <div className="flex justify-center mt-16 mb-24">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-900 text-xeoris-yellow hover:bg-black font-black py-4 px-10 rounded-2xl transition-all border-2 border-xeoris-yellow/20 hover:border-xeoris-yellow shadow-xl uppercase tracking-widest text-sm"
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

function StepDot({ num, active, label, onClick }: { num: number, active: boolean, label: string, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-3 px-6 py-2.5 rounded-full transition-all whitespace-nowrap",
        active ? "bg-xeoris-yellow text-[#16313a] font-black shadow-[0_5px_20px_rgba(255,224,8,0.3)]" : "text-xeoris-yellow/40",
        onClick && !active && "hover:text-xeoris-yellow hover:bg-xeoris-yellow/5"
      )}
    >
      <span className={cn(
        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black",
        active ? "bg-[#16313a] text-xeoris-yellow" : "bg-gray-800 text-xeoris-yellow/30"
      )}>{num}</span>
      <span className="text-sm uppercase tracking-tighter">{label}</span>
    </button>
  );
}
