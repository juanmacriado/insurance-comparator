'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ComparisonTable } from '@/components/ComparisonTable';
import { PDFGenerator } from '@/components/PDFGenerator';
import { extractTextAction, compareTextsAction } from './actions';
import { ComparisonReport } from '@/lib/comparator';
import { Loader2, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
    <main className="min-h-screen bg-white text-[#16313a] selection:bg-[#ffe008] selection:text-[#16313a] overflow-x-hidden">
      {/* Background Graphic */}
      <div className="xeoris-bg-image">
        <Image
          src="/background-xeoris.png"
          alt="Xeoris Background"
          width={1000}
          height={800}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Brand Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 py-5">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#16313a] p-2 rounded-xl shadow-lg">
              <ShieldCheck className="w-6 h-6 text-[#ffe008]" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-[#16313a]">XEORIS</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#16313a]/30 hidden md:block">
            El Ciberseguro Inteligente
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 pt-36 pb-20 relative z-10 max-w-6xl">
        {/* Hero Section */}
        <div className="flex flex-col items-center mb-16 animate-in fade-in duration-1000">
          <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter text-[#16313a] text-center leading-[0.9]">
            Comparador <br />
            {/* User request: Highlight in Yellow background */}
            <span className="text-[#16313a] bg-[#ffe008] px-6 py-2 rounded-[30px] inline-block mt-4 shadow-xl">Inteligente</span>
          </h1>
          <p className="text-[#16313a]/40 text-lg uppercase tracking-[0.3em] font-black text-center">
            Análisis de Pólizas con IA
          </p>
        </div>

        {/* Step Indicator - User request: Active steps in Yellow background */}
        <div className="flex justify-center mb-20">
          <div className="flex items-center gap-2 md:gap-4 bg-gray-100 p-2 rounded-[25px] border border-gray-200 shadow-inner">
            <StepDot num={1} active={step >= 1} label="Cliente" onClick={() => step > 1 && setStep(1)} />
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <StepDot num={2} active={step >= 2} label="Pólizas" onClick={() => step > 2 && setStep(2)} />
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <StepDot num={3} active={step >= 3} label="Resultado" />
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-10 bg-red-50 border-2 border-red-100 text-[#16313a] px-8 py-5 rounded-3xl text-center font-bold shadow-lg">
            {error}
          </div>
        )}

        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-white border border-gray-100 p-12 rounded-[40px] shadow-2xl">
              <div className="space-y-12">
                <div>
                  <label className="block text-xs font-black text-[#16313a] uppercase tracking-[0.2em] mb-4 opacity-50">Nombre del Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Indra Sistemas"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-[15px] px-8 py-6 text-2xl focus:outline-none focus:border-[#ffe008] transition-all text-[#16313a] font-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#16313a] uppercase tracking-[0.2em] mb-4 opacity-50">Número de Propuestas</label>
                  <select
                    value={numPolicies}
                    onChange={(e) => setNumPolicies(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-[15px] px-8 py-7 text-3xl focus:outline-none focus:border-[#ffe008] transition-all appearance-none cursor-pointer text-[#16313a] font-black"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n} className="bg-white font-bold text-[#16313a]">{n} Propuesta{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={startUploading}
                  className="w-full btn-xeoris text-2xl py-7"
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
              <h2 className="text-4xl font-black text-[#16313a] mb-2 tracking-tight">Carga de Documentos</h2>
              <p className="text-[#16313a]/40 font-black uppercase tracking-[0.4em]">
                Analizando <span className="text-[#16313a] border-b-4 border-[#ffe008]">{clientName}</span>
              </p>
            </div>

            <FileUpload slots={numPolicies} onFilesSelected={handleFilesSelected} />

            <div className="flex justify-center flex-col items-center gap-8 mt-16">
              <button
                onClick={handleCompare}
                className="btn-xeoris text-3xl px-24 py-8"
                disabled={files.filter(f => f !== null).length === 0}
              >
                Analizar con IA
              </button>
              <button onClick={() => setStep(1)} className="text-[#16313a]/40 hover:text-[#16313a] text-sm font-black uppercase tracking-widest transition-all">Cancelar y Volver</button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center py-24 animate-in fade-in">
            <Loader2 className="w-20 h-20 text-[#ffe008] animate-spin mb-10" />
            <p className="text-3xl font-black text-[#16313a] animate-pulse tracking-tight">{loadingMsg}</p>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 3 && report && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <ComparisonTable report={report} clientName={clientName} />
            <PDFGenerator report={report} clientName={clientName} />

            <div className="flex justify-center mt-12 mb-24">
              <button
                onClick={() => setStep(1)}
                className="bg-[#16313a] text-[#ffe008] hover:bg-black font-black py-5 px-16 rounded-[15px] transition-all shadow-xl uppercase tracking-widest text-sm"
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
        "flex items-center gap-2 md:gap-3 px-6 py-2.5 rounded-[15px] transition-all whitespace-nowrap",
        active ? "bg-[#ffe008] shadow-lg scale-105" : "bg-white/50 text-[#16313a]/30",
        onClick && !active && "hover:bg-white hover:text-[#16313a]"
      )}
    >
      <span className={cn(
        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors",
        active ? "bg-[#16313a] text-[#ffe008]" : "bg-gray-200 text-gray-400"
      )}>{num}</span>
      <span className={cn(
        "text-[10px] uppercase tracking-widest font-black transition-colors",
        active ? "text-[#16313a]" : "text-gray-400"
      )}>{label}</span>
    </button>
  );
}
