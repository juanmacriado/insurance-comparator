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
    <main className="min-h-screen bg-white text-xeoris-blue selection:bg-xeoris-yellow selection:text-xeoris-blue overflow-x-hidden">
      {/* Background Graphic from User */}
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
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 py-5">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-xeoris-blue p-2 rounded-xl shadow-lg">
              <ShieldCheck className="w-6 h-6 text-xeoris-yellow" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-xeoris-blue">XEORIS</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-xeoris-blue/30 hidden md:block">
            El Ciberseguro Inteligente
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 pt-36 pb-20 relative z-10 max-w-6xl">
        {/* Hero Section */}
        <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-xeoris-blue text-center leading-[0.85]">
            Comparador <br />
            <span className="text-xeoris-yellow bg-xeoris-blue px-6 py-2 rounded-[30px] inline-block mt-4 shadow-2xl">Inteligente</span>
          </h1>
          <p className="text-xeoris-blue/40 text-lg md:text-xl uppercase tracking-[0.4em] font-black text-center mt-4">
            Análisis de Pólizas con IA
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-20">
          <div className="flex items-center gap-4 bg-gray-50/50 backdrop-blur-sm p-2 rounded-[25px] border border-gray-100 shadow-xl">
            <StepDot num={1} active={step >= 1} label="Cliente" onClick={() => step > 1 && setStep(1)} />
            <ChevronRight className="w-5 h-5 text-gray-200" />
            <StepDot num={2} active={step >= 2} label="Pólizas" onClick={() => step > 2 && setStep(2)} />
            <ChevronRight className="w-5 h-5 text-gray-200" />
            <StepDot num={3} active={step >= 3} label="Resultado" />
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-10 bg-red-50 border-l-8 border-red-500 text-xeoris-blue px-8 py-6 rounded-2xl text-center font-black shadow-xl animate-in zoom-in-95">
            {error}
          </div>
        )}

        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="bg-white border border-gray-100 p-12 rounded-[40px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.1)] backdrop-blur-xl">
              <div className="space-y-12">
                <div>
                  <label className="block text-xs font-black text-xeoris-blue uppercase tracking-[0.3em] mb-4 opacity-40 italic">Nombre del Cliente o Proyecto</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Análisis Corporativo 2024"
                    className="w-full bg-gray-50 border-2 border-slate-100 rounded-[20px] px-8 py-6 text-2xl focus:outline-none focus:border-xeoris-yellow focus:ring-8 focus:ring-xeoris-yellow/5 transition-all text-xeoris-blue font-black placeholder:text-gray-200 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-xeoris-blue uppercase tracking-[0.3em] mb-4 opacity-40 italic">Número de Propuestas</label>
                  <div className="relative group">
                    <select
                      value={numPolicies}
                      onChange={(e) => setNumPolicies(parseInt(e.target.value))}
                      className="w-full bg-gray-50 border-2 border-slate-100 rounded-[20px] px-8 py-7 text-3xl focus:outline-none focus:border-xeoris-yellow transition-all appearance-none cursor-pointer text-xeoris-blue font-black shadow-inner"
                    >
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n} className="bg-white">{n} Propuesta{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-xeoris-blue/20 text-sm font-black uppercase tracking-widest group-hover:text-xeoris-yellow transition-colors">Seleccionar</div>
                  </div>
                </div>
                <button
                  onClick={startUploading}
                  className="w-full btn-xeoris text-2xl py-7"
                >
                  Siguiente paso <ArrowRight className="w-10 h-10 ml-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD */}
        {step === 2 && !loading && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black text-xeoris-blue mb-3 tracking-tighter">Carga de Documentos</h2>
              <p className="text-xeoris-blue/40 font-black uppercase tracking-[0.4em] text-sm">
                Analizando <span className="text-xeoris-blue border-b-4 border-xeoris-yellow">{clientName}</span>
              </p>
            </div>

            <FileUpload slots={numPolicies} onFilesSelected={handleFilesSelected} />

            <div className="flex justify-center flex-col items-center gap-8 mt-16">
              <button
                onClick={handleCompare}
                className="btn-xeoris text-3xl px-24 py-8 shadow-[0_25px_60px_-15px_rgba(255,224,8,0.5)]"
                disabled={files.filter(f => f !== null).length === 0}
              >
                Analizar con Xeoris AI
              </button>
              <button onClick={() => setStep(1)} className="text-xeoris-blue/30 hover:text-xeoris-blue text-sm font-black uppercase tracking-widest transition-all hover:bg-gray-100 px-8 py-3 rounded-full border border-transparent hover:border-gray-200">Volver al inicio</button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center py-24 animate-in fade-in">
            <div className="bg-xeoris-blue p-10 rounded-[50px] shadow-3xl relative mb-14 animate-pulse">
              <ShieldCheck className="w-20 h-20 text-xeoris-yellow" />
              <div className="absolute inset-0 bg-xeoris-yellow/30 rounded-[50px] blur-[80px] opacity-50"></div>
            </div>
            <p className="text-4xl font-black text-xeoris-blue tracking-tighter animate-bounce">{loadingMsg}</p>
            <p className="text-xeoris-blue/20 mt-6 text-[10px] font-black uppercase tracking-[1em]">Seguridad & Inteligencia Artificial</p>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 3 && report && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <ComparisonTable report={report} clientName={clientName} />
            <PDFGenerator report={report} clientName={clientName} />

            <div className="flex justify-center mt-16 mb-24">
              <button
                onClick={() => setStep(1)}
                className="bg-xeoris-blue text-white hover:bg-black font-black py-5 px-16 rounded-[25px] transition-all shadow-2xl uppercase tracking-[0.2em] text-sm hover:scale-105 active:scale-95"
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
        "flex items-center gap-3 px-8 py-3 rounded-[20px] transition-all whitespace-nowrap",
        active ? "bg-xeoris-blue text-white font-black shadow-2xl scale-105" : "text-gray-300",
        onClick && !active && "hover:text-xeoris-blue hover:bg-white"
      )}
    >
      <span className={cn(
        "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black",
        active ? "bg-xeoris-yellow text-xeoris-blue" : "bg-gray-100 text-gray-300"
      )}>{num}</span>
      <span className="text-[11px] uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}
