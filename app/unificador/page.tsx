'use client';

import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ArrowLeft, FilePlus, X, FileText, Loader2, Download, GripHorizontal } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface QueuedFile {
    id: string;
    file: File;
    previewUrl: string;
    thumbnail?: string;
}

function SortableItem({ id, item, onRemove }: { id: string, item: QueuedFile, onRemove: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative bg-white border border-gray-100 rounded-xl p-2 group transition-all duration-300 w-28 shrink-0",
                isDragging ? "shadow-2xl ring-2 ring-[#ffe008] scale-105 opacity-90" : "shadow-sm hover:shadow-md hover:border-[#ffe008]"
            )}
        >
            <div className="absolute top-1 right-1 z-10">
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-1 bg-red-50 text-red-400 hover:text-red-600 rounded-full transition-all opacity-0 group-hover:opacity-100 scale-75"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>

            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden mb-2 border border-gray-100 relative shadow-inner">
                    {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.file.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <Loader2 className="w-4 h-4 text-gray-200 animate-spin" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                </div>

                <div className="flex items-center gap-1">
                    <GripHorizontal className="w-3 h-3 text-gray-300 group-hover:text-[#ffe008] shrink-0" />
                    <p className="font-bold text-[#16313a] text-[8px] truncate uppercase tracking-tighter w-full">
                        {item.file.name}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PDFUnifier() {
    const [files, setFiles] = useState<QueuedFile[]>([]);
    const [mergedTitle, setMergedTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Set initial title with unique code
    useEffect(() => {
        const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        setMergedTitle(`Archivo unificado ${randomCode}`);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const generateThumbnail = async (file: File): Promise<string> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.3 }); // Reduced scale for smaller thumb

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport }).promise;
                return canvas.toDataURL('image/jpeg', 0.6);
            }
            return "";
        } catch (e) {
            console.error("Scale preview error", e);
            return "";
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            const newFiles: QueuedFile[] = selectedFiles.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                previewUrl: URL.createObjectURL(file)
            }));

            setFiles(prev => [...prev, ...newFiles]);

            // Generate thumbnails asynchronously
            for (const item of newFiles) {
                const thumb = await generateThumbnail(item.file);
                setFiles(current => current.map(f => f.id === item.id ? { ...f, thumbnail: thumb } : f));
            }
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleMergeAndDownload = async () => {
        if (files.length < 1) return;

        setLoading(true);
        setLoadingMsg("Construyendo PDF unificado...");

        try {
            console.log("Starting PDF merge of", files.length, "files");
            const mergedPdf = await PDFDocument.create();

            for (const queuedFile of files) {
                const arrayBuffer = await queuedFile.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            console.log("PDF generated successfully. Size:", pdfBytes.length, "bytes");

            if (pdfBytes.length === 0) {
                throw new Error("El PDF generado está vacío.");
            }

            // Use octet-stream to force download rather than navigation
            const blob = new Blob([pdfBytes as any], { type: 'application/octet-stream' });
            const fileName = mergedTitle.trim().endsWith('.pdf') ? mergedTitle.trim() : `${mergedTitle.trim()}.pdf`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            // CRITICAL: Ensure no target="_blank" to prevent internal browser navigation
            link.style.display = 'none';
            link.href = url;
            link.download = fileName;

            // Append to body is required for some browsers
            document.body.appendChild(link);

            console.log("Triggering robust download for:", fileName);
            link.click();

            // We keep the link and URL significantly longer to ensure the browser has time to handle it
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                // DO NOT revokeObjectURL here immediately.
                // Keeping it for 60 seconds ensures any background download processes can finish.
                setTimeout(() => window.URL.revokeObjectURL(url), 60000);
                console.log("Download interaction complete. Blob URL held for 60s.");
            }, 1000);

            setLoadingMsg("¡Documento descargado!");
            setTimeout(() => setLoading(false), 2000);
        } catch (error) {
            console.error("Error merging PDFs:", error);
            alert(`Error al procesar los archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#fafbfc] text-[#16313a] selection:bg-[#ffe008] selection:text-[#16313a] overflow-x-hidden">
            {/* Brand Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 py-5">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="bg-[#16313a] p-2 rounded-xl shadow-lg hover:bg-black transition-colors group">
                            <ShieldCheck className="w-6 h-6 text-[#ffe008] group-hover:scale-110 transition-transform" />
                        </Link>
                        <span className="text-2xl font-black tracking-tighter text-[#16313a]">XEORIS</span>
                    </div>
                    <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#16313a]/30 hover:text-[#16313a] transition-all">
                        <ArrowLeft className="w-4 h-4" /> Volver al Hub
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-6 pt-36 pb-20 relative z-10 max-w-6xl">
                <div className="flex flex-col items-center mb-16 animate-in fade-in duration-1000">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[2px] w-12 bg-[#ffe008] rounded-full hidden md:block"></div>
                        <p className="text-[#16313a]/40 text-xs uppercase tracking-[0.5em] font-black text-center">SOLUCIÓN DE PRODUCTIVIDAD</p>
                        <div className="h-[2px] w-12 bg-[#ffe008] rounded-full hidden md:block"></div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-[#16313a] text-center leading-[0.9]">
                        Unificador de <br />
                        <span className="text-[#16313a] bg-[#ffe008] px-8 py-2 rounded-[40px] inline-block mt-4 shadow-2xl skew-x-[-2deg]">Documentos</span>
                    </h1>
                </div>

                <div className="grid lg:grid-cols-[1fr_350px] gap-12">

                    {/* Main Collection Area */}
                    <div className="space-y-8 min-w-0">
                        <div className="bg-white border-2 border-dashed border-gray-200 p-10 rounded-[40px] text-center group hover:border-[#ffe008] transition-all duration-500 bg-gradient-to-b from-white to-gray-50/50">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 bg-[#ffe008] rounded-[25px] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group-hover:rotate-6 mx-auto mb-4"
                            >
                                <FilePlus className="w-8 h-8 text-[#16313a]" />
                            </button>
                            <h3 className="text-xl font-black mb-1 tracking-tight">Añadir Archivos</h3>
                            <p className="text-[#16313a]/40 font-bold text-[10px] uppercase tracking-widest">
                                Selecciona tus documentos PDF
                            </p>
                            <input
                                type="file"
                                multiple
                                accept=".pdf"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>

                        {files.length > 0 ? (
                            <div className="bg-white/50 p-6 rounded-[30px] border border-gray-100">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={files.map(f => f.id)}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="flex flex-wrap gap-4 justify-start animate-in fade-in slide-in-from-bottom-5">
                                            {files.map((item) => (
                                                <SortableItem key={item.id} id={item.id} item={item} onRemove={removeFile} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        ) : (
                            <div className="py-32 flex flex-col items-center justify-center opacity-10">
                                <FileText className="w-24 h-24 mb-6" />
                                <p className="font-black uppercase tracking-[0.5em] text-sm">Biblioteca vacía</p>
                            </div>
                        )}
                    </div>

                    {/* Controls Sidebar */}
                    <div className="relative">
                        <div className="sticky top-28 space-y-8 z-40">
                            <div className="bg-[#16313a] text-white p-8 rounded-[40px] shadow-2xl border border-white/10 overflow-hidden relative">
                                <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[#ffe008] opacity-10 rounded-full blur-3xl"></div>

                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-[#ffe008]">Ajustes de Salida</h4>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">Nombre del PDF Final</label>
                                        <input
                                            type="text"
                                            value={mergedTitle}
                                            onChange={(e) => setMergedTitle(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-[15px] px-6 py-4 text-white focus:outline-none focus:border-[#ffe008] transition-all font-bold placeholder:text-white/20"
                                            placeholder="Ej. Propuesta Global"
                                        />
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
                                            <span>Documentos</span>
                                            <span>{files.length}</span>
                                        </div>
                                        <div className="h-[1px] bg-white/10 w-full"></div>

                                        <button
                                            onClick={handleMergeAndDownload}
                                            disabled={loading || files.length < 1}
                                            className="w-full btn-xeoris py-6 text-xl flex items-center justify-center gap-3 mt-4 disabled:grayscale disabled:opacity-30"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <Download className="w-6 h-6" />
                                            )}
                                            {loading ? "Procesando..." : "Descargar PDF"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border-2 border-gray-100 p-8 rounded-[40px] shadow-xl">
                                <h5 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-40 italic">Instrucciones Rápidas</h5>
                                <ul className="space-y-4">
                                    {[
                                        "Añade documentos con el botón superior.",
                                        "Arrastra las portadas para cambiar el orden.",
                                        "Revisa las miniaturas para confirmar.",
                                        "Personaliza el título y descarga."
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-xs font-bold leading-relaxed">
                                            <span className="text-[#ffe008]">•</span>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#16313a]/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-center p-6"
                    >
                        <Loader2 className="w-24 h-24 text-[#ffe008] animate-spin mb-10" />
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">{loadingMsg}</h2>
                        <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-sm italic">Xeoris está orquestando tus archivos...</p>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}
