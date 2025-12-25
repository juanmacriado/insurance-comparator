'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { ComparisonTable } from '@/components/ComparisonTable';
import { PDFGenerator } from '@/components/PDFGenerator';
import { processAndComparePDFs } from './actions';
import { ComparisonReport } from '@/lib/comparator';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<{ f1: File | null, f2: File | null }>({ f1: null, f2: null });

  const handleFilesSelected = (f1: File | null, f2: File | null) => {
    setFiles({ f1, f2 });
    // Reset report when files change
    setReport(null);
    setError(null);
  };

  const handleCompare = async () => {
    if (!files.f1 || !files.f2) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file1', files.f1);
      formData.append('file2', files.f2);

      const result = await processAndComparePDFs(formData);
      setReport(result);
    } catch (err) {
      console.error("DEBUG ERROR:", err);
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(`Error: ${message}. Esto puede deberse a que los archivos son muy grandes o al tiempo de espera de Vercel.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-xeoris-blue mb-4">
            Comparador de Pólizas
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analiza y compara tus coberturas de ciberseguridad con inteligencia.
            Sube dos pólizas y descubre cuál ofrece mejor protección.
          </p>
        </div>

        <FileUpload onFilesSelected={handleFilesSelected} />

        <div className="flex justify-center mb-12">
          <button
            onClick={handleCompare}
            disabled={!files.f1 || !files.f2 || loading}
            className="bg-xeoris-blue disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-semibold px-12 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" /> Procesando...
              </>
            ) : (
              "Comparar Pólizas Ahora"
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 max-w-2xl mx-auto mb-8">
            <AlertCircle className="w-6 h-6" />
            <p>{error}</p>
          </div>
        )}

        {report && files.f1 && files.f2 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            <ComparisonTable
              report={report}
              file1Name={files.f1.name}
              file2Name={files.f2.name}
            />
            <PDFGenerator
              report={report}
              file1Name={files.f1.name}
              file2Name={files.f2.name}
            />
          </div>
        )}
      </main>
    </div>
  );
}
