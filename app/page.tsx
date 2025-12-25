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
    <main className="min-h-screen bg-gray-50 text-gray-900 selection:bg-xeoris-yellow selection:text-[#16313a]">
      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden h-screen opacity-5">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-xeoris-yellow rounded-full blur-[150px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[#16313a] rounded-full blur-[120px] -ml-20 -mb-20"></div>
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="bg-[#16313a] p-4 rounded-3xl mb-6 shadow-xl">
            <ShieldCheck className="w-16 h-16 text-xeoris-yellow" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter text-[#16313a]">
            XEORIS <span className="text-xeoris-yellow p-1 bg-[#16313a] rounded-xl px-4">COMPARATOR</span>
          </h1>
          <p className="text-[#16313a]/60 text-lg uppercase tracking-[0.3em] font-black">
            Inteligencia Artificial para Ciberseguros
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4 bg-white p-3 rounded-full shadow-sm border border-gray-100">
            <StepDot num={1} active={step >= 1} label="Cliente" onClick={() => step > 1 && setStep(1)} />
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <StepDot num={2} active={step >= 2} label="Documentos" onClick={() => step > 2 && setStep(2)} />
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <StepDot num={3} active={step >= 3} label="Análisis" />
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-3xl text-center text-sm font-bold animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}

        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-white border border-gray-200 p-10 rounded-[2.5rem] shadow-2xl">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-black text-[#16313a] uppercase tracking-widest mb-4">Nombre de la Empresa / Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Multinacional Tecnológica S.A."
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-8 py-5 text-2xl focus:outline-none focus:border-xeoris-yellow focus:ring-4 focus:ring-xeoris-yellow/10 transition-all text-gray-900 placeholder:text-gray-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-[#16313a] uppercase tracking-widest mb-4">Número de Propuestas a Comparar</label>
                  <select
                    value={numPolicies}
                    onChange={(e) => setNumPolicies(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-8 py-6 text-3xl focus:outline-none focus:border-xeoris-yellow transition-all appearance-none cursor-pointer text-[#16313a] font-black"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-white text-[#16313a]">{n} Propuesta{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={startUploading}
                  className="w-full bg-xeoris-yellow text-[#16313a] font-black py-5 rounded-2xl text-2xl hover:bg-[#16313a] hover:text-xeoris-yellow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group shadow-xl"
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
              <h2 className="text-4xl font-black text-[#16313a] mb-2">Sube tus documentos</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest">
                Cliente: <span className="text-[#16313a]">{clientName}</span> | <span className="text-xeoris-yellow bg-[#16313a] px-2 py-0.5 rounded">{numPolicies} ofertas</span>
              </p>
            </div>

            <FileUpload slots={numPolicies} onFilesSelected={handleFilesSelected} />

            <div className="flex justify-center flex-col items-center gap-6 mt-12">
              <button
                onClick={handleCompare}
                className="bg-[#16313a] text-xeoris-yellow font-black py-6 px-16 rounded-2xl text-2xl hover:bg-black hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl disabled:opacity-50"
                disabled={files.filter(f => f !== null).length === 0}
              >
                Analizar Coberturas con IA
              </button>
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-[#16313a] text-sm font-black uppercase tracking-[0.2em] transition-all">Atrás</button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center py-20 animate-in fade-in">
            <Loader2 className="w-24 h-24 text-[#16313a] animate-spin mb-8" />
            <p className="text-3xl font-black text-[#16313a] animate-pulse">{loadingMsg}</p>
            <p className="text-gray-400 mt-4 text-sm font-bold uppercase tracking-widest">Xeoris Global AI Engine</p>
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
                className="bg-white text-[#16313a] hover:bg-gray-50 font-black py-4 px-10 rounded-2xl transition-all border-2 border-[#16313a]/10 hover:border-[#16313a] shadow-xl uppercase tracking-widest text-sm"
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
        "flex items-center gap-2 px-6 py-2 rounded-full transition-all whitespace-nowrap",
        active ? "bg-[#16313a] text-white font-black shadow-lg" : "text-gray-400",
        onClick && !active && "hover:text-[#16313a] hover:bg-gray-50"
      )}
    >
      <span className={cn(
        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black",
        active ? "bg-xeoris-yellow text-[#16313a]" : "bg-gray-100 text-gray-400"
      )}>{num}</span>
      <span className="text-xs uppercase tracking-tighter">{label}</span>
    </button>
  );
}
