'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, AlertCircle, Copy, RefreshCw, Share2, Download, Maximize2, Sparkles, History, Save, Image as ImageIcon, Wand2, Globe, ArrowLeft, ArrowRight, LayoutDashboard, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { processNewsUrlAction, generateFinalContentAction, generateImageAction, savePromptAction, getSavedPromptsAction } from '@/app/actions/social-agent-orchestrator';
import { ProcessedNews, PostVariation, AnalysisResult } from '@/lib/social-agent/types';
import { PlatformContent } from '@/lib/social-agent/platform-generator';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Tipos para los datos
type Platform = 'linkedin' | 'twitter' | 'instagram' | 'blog';

interface SavedPrompt {
    id: string;
    name: string;
    prompt: string;
    platform: Platform;
    timestamp: number;
}

export default function SocialMediaAgent() {
    // Estados principales
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [urlInput, setUrlInput] = useState('');
    const [customInstructions, setCustomInstructions] = useState(''); // New state for custom instructions
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Datos procesados
    const [processedNews, setProcessedNews] = useState<ProcessedNews | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<PostVariation | null>(null);
    const [platformContent, setPlatformContent] = useState<PlatformContent | null>(null);
    const [audience, setAudience] = useState<'technology_partners' | 'insurance_brokers' | 'data_protection' | 'general'>('technology_partners');

    // Generación de Imagen
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatingImage, setGeneratingImage] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Gestión de Prompts
    const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
    const [activePlatform, setActivePlatform] = useState<Platform>('linkedin');

    // Load Saved Prompts on mount
    useEffect(() => {
        // loadPrompts(); // TODO: Implement saved prompts fetching correctly if needed
    }, []);

    const handleProcessUrl = async () => {
        if (!urlInput.trim()) return;

        setLoading(true);
        setLoadingStep('Analizando contenido de la URL...');
        setError(null);

        try {
            const data = await processNewsUrlAction(urlInput);
            if (!data) throw new Error("No se pudo extraer información");

            setProcessedNews(data);
            setStep(2);
        } catch (err) {
            console.error(err);
            setError("Error al procesar la noticia. Verifica la URL.");
        } finally {
            setLoading(false);
        }
    };

    const generateContentForPlatform = async (platform: Platform, variation: PostVariation) => {
        if (!processedNews) return;

        setLoading(true);
        setLoadingStep(`Redactando contenido para ${platform}...`);

        try {
            const content = await generateFinalContentAction(
                processedNews.analysis,
                variation.angle,
                audience,
                customInstructions,
                platform
            );

            setPlatformContent(prev => ({
                ...prev,
                ...content
            }));

        } catch (err) {
            console.error(err);
            setError(`Error generando contenido para ${platform}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateContent = async (variation: PostVariation) => {
        if (!processedNews) return;

        setSelectedVariation(variation);
        setPlatformContent({}); // Reset content
        setStep(3);

        // Generate for the default/active platform (LinkedIn usually)
        await generateContentForPlatform(activePlatform, variation);

        // Auto-generate image prompt proposal
        setImagePrompt(`Ilustración minimalista y moderna sobre: ${processedNews.original.title}. Estilo corporativo tecnológico de Xeoris, colores azul oscuro y amarillo neón, alta calidad, 4k. Concepto: ${variation.angle}`);
    };

    const handlePlatformChange = async (platform: Platform) => {
        setActivePlatform(platform);

        if (!selectedVariation) return;

        // Check if content exists specifically for the target platform
        const hasContent =
            (platform === 'linkedin' && !!platformContent?.linkedin) ||
            (platform === 'twitter' && !!platformContent?.twitter) ||
            (platform === 'instagram' && !!platformContent?.instagram) ||
            (platform === 'blog' && !!platformContent?.blog);

        // If content for this platform doesn't exist, generate it
        if (!hasContent) {
            await generateContentForPlatform(platform, selectedVariation);
        }
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt) return;

        setGeneratingImage(true);
        try {
            const imageUrl = await generateImageAction(imagePrompt);
            setGeneratedImage(imageUrl);
        } catch (err) {
            console.error(err);
            setError("Falló la generación de imagen.");
        } finally {
            setGeneratingImage(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getPlatformText = (platform: Platform): string => {
        if (!platformContent) return '';

        const sourceLink = processedNews?.original?.url ? `\n\nFuente: ${processedNews.original.url}` : '';

        switch (platform) {
            case 'linkedin':
                return (platformContent.linkedin?.text || '') + sourceLink;
            case 'twitter':
                return (platformContent.twitter?.thread.join('\n\n---\n\n') || '') + sourceLink;
            case 'instagram':
                return (platformContent.instagram?.caption || '') + sourceLink;
            case 'blog':
                return (platformContent.blog ? `TITLE: ${platformContent.blog.title}\n\n${platformContent.blog.content}` : '') + sourceLink;
            default:
                return '';
        }
    };

    return (
        <main className="min-h-screen text-slate-800 dark:text-slate-100 pb-20 overflow-x-hidden selection:bg-secondary selection:text-primary">
            {/* Background Graphic elements handled by layout/globals */}

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-200 dark:border-slate-800 py-4 transition-colors duration-300">
                <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl shadow-lg">
                                <Sparkles className="w-5 h-5 text-secondary" />
                            </div>
                            <h1 className="text-xl font-display font-bold tracking-tight uppercase text-primary dark:text-white">
                                Social Media Agent
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Spacer */}
            <div className="h-28"></div>

            <div className="container mx-auto px-6 max-w-5xl">

                {/* Progress Steps */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4 glass-card px-6 py-3 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                        <StepIndicator num={1} active={step >= 1} current={step === 1} label="Fuente" />
                        <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700"></div>
                        <StepIndicator num={2} active={step >= 2} current={step === 2} label="Estrategia" />
                        <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700"></div>
                        <StepIndicator num={3} active={step >= 3} current={step === 3} label="Contenido" />
                    </div>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="font-bold text-sm">{error}</p>
                    </div>
                )}

                {/* STEP 1: INPUT URL */}
                {step === 1 && (
                    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="glass-card p-10 rounded-[32px] shadow-2xl border border-slate-200/50 dark:border-slate-700/50 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>

                            <div className="w-20 h-20 bg-primary/5 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 text-primary dark:text-white shadow-inner">
                                <Globe className="w-10 h-10" />
                            </div>

                            <h2 className="text-4xl font-display font-bold text-primary dark:text-white mb-4 tracking-tight">¿Qué noticia analizamos hoy?</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                                Introduce la URL de una noticia del sector asegurador o tecnológico y generaremos contenido viral.
                            </p>

                            <div className="flex gap-3 relative z-10">
                                <input
                                    type="text"
                                    placeholder="https://ejemplo.com/noticia-importante"
                                    className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-5 text-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all backdrop-blur-sm"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleProcessUrl()}
                                />
                                <button
                                    onClick={handleProcessUrl}
                                    disabled={loading}
                                    className="bg-primary hover:bg-indigo-900 text-white px-8 rounded-2xl font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                                >
                                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-6 h-6" />}
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 mt-6 max-w-2xl mx-auto">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left ml-2">Instrucciones Adicionales (Opcional)</label>
                                <textarea
                                    placeholder="Ej: Enfócate en los riesgos para startups tecnológicas. Usa un tono más agresivo."
                                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all backdrop-blur-sm min-h-[80px] resize-none"
                                    value={customInstructions}
                                    onChange={(e) => setCustomInstructions(e.target.value)}
                                />
                            </div>

                            {/* Example Chips */}
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                {['Ciberseguridad en Pymes', 'Nueva Ley IA', 'Seguros Paramétricos'].map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => setUrlInput(`https://news.google.com/search?q=${encodeURIComponent(tag)}`)}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase tracking-wider"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* LOADING OVERLAY */}
                {loading && (
                    <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm z-[60] flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 bg-secondary/30 blur-2xl rounded-full"></div>
                            <Loader2 className="w-16 h-16 text-primary dark:text-white animate-spin relative z-10" />
                        </div>
                        <h3 className="mt-8 text-2xl font-display font-bold text-primary dark:text-white animate-pulse">{loadingStep}</h3>
                    </div>
                )}

                {/* STEP 2: SELECT VARIATION */}
                {step === 2 && processedNews && !loading && (
                    <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-display font-bold text-primary dark:text-white mb-2">{processedNews.original.title}</h2>
                            <div className="flex justify-center gap-2 mt-4">
                                <span className="px-3 py-1 bg-secondary/20 text-yellow-800 dark:text-yellow-200 rounded-full text-[10px] font-black uppercase tracking-widest border border-secondary/30">
                                    {processedNews.analysis.topic}
                                </span>
                                <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-300 dark:border-slate-700">
                                    {processedNews.analysis.tone}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center mb-10">
                            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
                                {(['technology_partners', 'insurance_brokers', 'data_protection', 'general'] as const).map((aud) => (
                                    <button
                                        key={aud}
                                        onClick={() => setAudience(aud)}
                                        className={cn(
                                            "px-4 md:px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                            audience === aud
                                                ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        )}
                                    >
                                        {aud === 'technology_partners' && "Partner Tecnológico"}
                                        {aud === 'insurance_brokers' && "Correduría Seguros"}
                                        {aud === 'data_protection' && "Partner Legal/RGPD"}
                                        {aud === 'general' && "General / Concienciación"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h3 className="text-center text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mb-8">Selecciona el enfoque del contenido</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {processedNews.variations.map((variation, idx) => (
                                <VariationCard
                                    key={idx}
                                    title={variation.angle}
                                    desc={variation.headline}
                                    preview={variation.body}
                                    icon={<Sparkles className="w-6 h-6" />}
                                    onClick={() => handleGenerateContent(variation)}
                                />
                            ))}
                        </div>

                        <div className="flex justify-center mt-12">
                            <button onClick={() => setStep(1)} className="text-slate-400 hover:text-primary dark:hover:text-white font-bold text-sm uppercase tracking-widest transition-colors">
                                Cancelar y volver
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: RESULT & IMAGE */}
                {step === 3 && platformContent && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">

                        {/* LEFT COL: CONTENT EDITOR */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="glass-card p-1 rounded-[32px] border border-slate-200 dark:border-slate-700 flex p-1.5 shadow-sm">
                                {(['linkedin', 'twitter', 'instagram', 'blog'] as Platform[]).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => handlePlatformChange(p)}
                                        className={cn(
                                            "flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all gap-2 flex justify-center items-center",
                                            activePlatform === p
                                                ? "bg-primary text-white shadow-lg"
                                                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        {p === 'linkedin' && <LinkedinIcon className="w-4 h-4" />}
                                        {p === 'twitter' && <TwitterIcon className="w-4 h-4" />}
                                        {p === 'instagram' && <InstagramIcon className="w-4 h-4" />}
                                        {p === 'blog' && <FileTextIcon className="w-4 h-4" />}
                                        <span className="hidden sm:inline">{p}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="glass-card p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-700/50 shadow-lg relative min-h-[400px]">
                                <textarea
                                    className="w-full h-full min-h-[400px] bg-transparent border-none resize-none focus:ring-0 text-slate-700 dark:text-slate-200 text-lg leading-relaxed selection:bg-secondary/30"
                                    value={getPlatformText(activePlatform)}
                                    readOnly
                                />
                                <button
                                    onClick={() => copyToClipboard(getPlatformText(activePlatform))}
                                    className="absolute top-6 right-6 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-colors shadow-sm"
                                    title="Copiar texto"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    Volver a Estrategia
                                </button>
                                <button onClick={() => handleProcessUrl()} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all">
                                    Nueva Noticia
                                </button>
                            </div>
                        </div>

                        {/* RIGHT COL: IMAGE GENERATOR */}
                        <div className="space-y-6">
                            <div className="glass-card p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                                <h3 className="text-lg font-display font-bold text-primary dark:text-white mb-6 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-secondary" /> Generador de Imagen
                                </h3>

                                <div className="aspect-square bg-slate-100 dark:bg-slate-800/50 rounded-2xl mb-6 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                                    {generatingImage ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="w-10 h-10 text-secondary animate-spin mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Generando...</p>
                                        </div>
                                    ) : generatedImage ? (
                                        <>
                                            <Image src={generatedImage} alt="Generated" fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <a href={generatedImage} download="xeoris-social.png" target="_blank" className="p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-primary transition-all">
                                                    <Download className="w-6 h-6" />
                                                </a>
                                                <button onClick={() => setGeneratedImage(null)} className="p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-red-500 hover:text-white transition-all">
                                                    <RefreshCw className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-8">
                                            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-sm font-bold text-slate-400">La imagen aparecerá aquí</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Prompt de Imagen</label>
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-secondary focus:border-transparent min-h-[100px] resize-none"
                                            value={imagePrompt}
                                            onChange={(e) => setImagePrompt(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleGenerateImage}
                                        disabled={generatingImage || !imagePrompt}
                                        className="w-full py-4 bg-secondary text-primary rounded-xl font-bold uppercase tracking-widest text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {generatedImage ? 'Regenerar Imagen' : 'Crear Imagen IA'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </main >
    );
}

// Subcomponents
function StepIndicator({ num, active, current, label }: { num: number, active: boolean, current: boolean, label: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                active ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                current && "ring-2 ring-secondary ring-offset-2 dark:ring-offset-slate-900"
            )}>
                {active ? <CheckCircle className="w-4 h-4" /> : num}
            </div>
            <span className={cn(
                "text-xs font-bold uppercase tracking-widest hidden md:inline-block",
                active ? "text-primary dark:text-white" : "text-slate-400"
            )}>{label}</span>
        </div>
    )
}

function VariationCard({ title, desc, preview, icon, onClick }: { title: string, desc: string, preview: string, icon: React.ReactNode, onClick: () => void }) {
    return (
        <button onClick={onClick} className="text-left glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 hover:border-secondary hover:shadow-xl transition-all group relative overflow-hidden h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors">
                    {icon}
                </div>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-secondary group-hover:text-primary transition-colors">
                    Seleccionar
                </div>
            </div>
            <h4 className="text-xl font-display font-bold text-primary dark:text-white mb-2">{title}</h4>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{desc}</p>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs text-slate-500 line-clamp-3 italic">"{preview}"</p>
            </div>
        </button>
    )
}

// ICONS
function MessageCircleIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
}
function LinkedinIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
}
function TwitterIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
}
function InstagramIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
}
function FileTextIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
}
