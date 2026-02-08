'use client';

import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ArrowLeft, FilePlus, X, FileText, Loader2, Download, GripHorizontal, FileStack } from 'lucide-react';
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
                "relative glass-card p-2 group transition-all duration-300 w-32 shrink-0 border border-slate-200/50 dark:border-slate-700/50",
                isDragging ? "shadow-2xl ring-2 ring-secondary scale-105 opacity-90" : "shadow-sm hover:shadow-xl hover:border-secondary/50 dark:hover:border-secondary/50"
            )}
        >
            <div className="absolute top-1 right-1 z-10">
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 bg-red-500 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 scale-75 hover:scale-100 shadow-sm"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>

            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden mb-3 border border-slate-200 dark:border-slate-700 relative shadow-inner flex items-center justify-center">
                    {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.file.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors" />
                </div>

                <div className="flex items-center gap-2 px-1">
                    <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-secondary shrink-0" />
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-[10px] truncate uppercase tracking-tight w-full" title={item.file.name}>
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
        <main className="min-h-screen text-slate-900 dark:text-slate-100 selection:bg-secondary selection:text-primary overflow-x-hidden pb-32">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-200 dark:border-slate-800 py-4 transition-colors duration-300">
                <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl shadow-lg">
                                <FileStack className="w-5 h-5 text-secondary" />
                            </div>
                            <h1 className="text-xl font-display font-bold tracking-tight uppercase text-primary dark:text-white">
                                Unificador de Documentos
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Spacer */}
            <div className="h-32"></div>

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-black uppercase tracking-widest text-[10px] mb-6">
                        <ShieldCheck className="w-3 h-3" /> Solución de Productividad
                    </div>
                    <h1 className="text-5xl md:text-6xl font-display font-bold text-primary dark:text-white mb-6 tracking-tight leading-tight">
                        Unifica tus PDFs en <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-200">un solo archivo</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Arrastra y suelta tus documentos para combinarlos en el orden que prefieras. Rápido, seguro y sin marcas de agua.
                    </p>
                </div>

                <div className="grid lg:grid-cols-[1fr_350px] gap-8">

                    {/* Main Collection Area */}
                    <div className="space-y-8 min-w-0">
                        {/* Drop Zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="glass-card border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 rounded-[40px] text-center group hover:border-secondary hover:bg-secondary/5 transition-all duration-300 cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full -mr-16 -mt-16 blur-xl group-hover:scale-150 transition-transform duration-700"></div>

                            <div className="w-20 h-20 bg-primary/5 dark:bg-white/5 rounded-[25px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                                <FilePlus className="w-10 h-10 text-primary dark:text-white group-hover:text-secondary transition-colors" />
                            </div>
                            <h3 className="text-2xl font-display font-bold text-primary dark:text-white mb-2 tracking-tight">Añadir Archivos</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                Haz clic o arrastra PDFs aquí
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

                        {/* File Grid */}
                        {files.length > 0 ? (
                            <div className="glass-card p-8 rounded-[40px] border border-slate-200/50 dark:border-slate-700/50 min-h-[200px]">
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Archivos en cola ({files.length})</h4>
                                    <button
                                        onClick={() => setFiles([])}
                                        className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full"
                                    >
                                        Limpiar Todo
                                    </button>
                                </div>

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={files.map(f => f.id)}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="flex flex-wrap gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
                                            {files.map((item) => (
                                                <SortableItem key={item.id} id={item.id} item={item} onRemove={removeFile} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        ) : null}
                    </div>

                    {/* Controls Sidebar */}
                    <div className="relative">
                        <div className="sticky top-32 space-y-6 z-40">
                            <div className="glass-card bg-primary dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-white/10 dark:border-slate-700 overflow-hidden relative flex flex-col items-center text-center">
                                <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-secondary opacity-20 rounded-full blur-3xl animate-pulse"></div>

                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-secondary">Configuración</h4>

                                <div className="space-y-6 w-full relative z-10">
                                    <div className="text-left">
                                        <label className="block text-[9px] font-bold uppercase tracking-widest mb-2 text-slate-400 pl-1">Nombre del Archivo</label>
                                        <input
                                            type="text"
                                            value={mergedTitle}
                                            onChange={(e) => setMergedTitle(e.target.value)}
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-all font-bold text-sm placeholder:text-white/20"
                                            placeholder="Ej. Propuesta Global"
                                        />
                                    </div>

                                    <div className="pt-2 space-y-4">
                                        <button
                                            onClick={handleMergeAndDownload}
                                            disabled={loading || files.length < 1}
                                            className="w-full bg-secondary text-primary py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:bg-yellow-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            {loading ? "Procesando..." : "Descargar PDF"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-700/50 text-center">
                                <h5 className="text-[9px] font-black uppercase tracking-widest mb-4 text-slate-400">Guía Rápida</h5>
                                <ul className="space-y-3">
                                    {[
                                        "Añade documentos PDF.",
                                        "Arrastra para ordenar.",
                                        "Revisa las miniaturas.",
                                        "Descarga tu archivo."
                                    ].map((text, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 text-left">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1 shrink-0"></span>
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
                        className="fixed inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-center p-6"
                    >
                        <Loader2 className="w-16 h-16 text-secondary animate-spin mb-8" />
                        <h2 className="text-3xl font-display font-bold text-primary dark:text-white mb-2 tracking-tight">{loadingMsg}</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Unificando documentos...</p>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}
