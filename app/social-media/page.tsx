'use client';

import { useState, useEffect } from 'react';
import { processNewsUrlAction, generateFinalContentAction, generateImageAction, savePromptAction, getSavedPromptsAction } from '../actions/social-agent-orchestrator';
import { ProcessedNews, SavedPrompt } from '@/lib/social-agent/types';
import { PlatformContent } from '@/lib/social-agent/platform-generator';
import { Copy, ArrowRight, Loader2, ExternalLink, CheckCircle, FileText, Linkedin, Twitter, Instagram, Settings2, ChevronDown, ChevronUp, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function SocialMediaPage() {
    // Stage 1: Input URL
    const [url, setUrl] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');
    const [audience, setAudience] = useState('technology_partners');
    const [showInstructions, setShowInstructions] = useState(false); // Restored state

    // Prompt Management
    const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
    const [promptName, setPromptName] = useState('');

    // Stage 2: Selection
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [data, setData] = useState<ProcessedNews | null>(null);

    // Stage 3: Final Output (Partial)
    const [generatingFinal, setGeneratingFinal] = useState(false); // Used for "Step 1" selection spinner (now unused for generation)
    const [generatingPlatform, setGeneratingPlatform] = useState<string | null>(null); // For individual tabs
    const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
    // Initialize as empty object to support partial generation
    const [finalContent, setFinalContent] = useState<Partial<PlatformContent>>({});
    const [activeTab, setActiveTab] = useState<'blog' | 'linkedin' | 'twitter' | 'instagram'>('linkedin');

    // Image Stage
    const [generatingImage, setGeneratingImage] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    // Load Prompts on Mount
    useEffect(() => {
        getSavedPromptsAction().then(setSavedPrompts).catch(console.error);
    }, []);

    const handleSavePrompt = async () => {
        if (!promptName || !customInstructions) return;
        try {
            await savePromptAction(promptName, customInstructions);
            setPromptName('');
            const updated = await getSavedPromptsAction();
            setSavedPrompts(updated);
        } catch (e) {
            console.error(e);
            alert("Error guardando prompt.");
        }
    };

    const handleProcess = async () => {
        if (!url) return;
        setLoading(true);
        setStatus('Iniciando agente...');
        setData(null);
        setFinalContent({}); // Reset content
        setGeneratedImageUrl(null);
        setSelectedVariation(null); // Reset selected variation

        try {
            const timer1 = setTimeout(() => setStatus('📥 Extrayendo contenido...'), 500);
            const timer2 = setTimeout(() => setStatus('🧠 Analizando semántica...'), 2500);
            const timer3 = setTimeout(() => setStatus('✍️ Planteando estrategias...'), 6000);

            const result = await processNewsUrlAction(url);

            clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
            setData(result);
        } catch (error) {
            console.error(error);
            alert("Error al procesar la noticia. Verifica la URL.");
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    const handleSelectVariation = (angle: string) => {
        setSelectedVariation(angle);
        setFinalContent({}); // Reset content
        setActiveTab('linkedin'); // Default tab
        setGeneratedImageUrl(null); // Reset image
        // Note: We do NOT generate content yet. User must click "Generate" in the tab.
    };

    const handleGeneratePlatform = async (platform: 'blog' | 'linkedin' | 'twitter' | 'instagram') => {
        if (!data || !selectedVariation) return;

        setGeneratingPlatform(platform);
        try {
            const result = await generateFinalContentAction(
                data.analysis,
                selectedVariation,
                audience,
                customInstructions,
                platform
            );

            // Merge new content into state
            setFinalContent(prev => ({
                ...prev,
                [platform]: result[platform]
            }));

        } catch (error) {
            console.error(error);
            alert(`Error generando contenido para ${platform}`);
        } finally {
            setGeneratingPlatform(null);
        }
    };

    const handleGenerateImage = async () => {
        setGeneratingImage(true);

        // Dynamic Prompt Strategy based on Active Tab context
        let promptToUse = "";

        // 1. Try to use the specific Visual Prompt if available (usually best quality)
        if (finalContent.instagram?.visualPrompt) {
            promptToUse = finalContent.instagram.visualPrompt;
        }
        // 2. If not, try to use the content of the ACTIVE tab
        else if (activeTab === 'linkedin' && finalContent.linkedin?.text) {
            // Summarize the LinkedIn post for the prompt
            const summary = finalContent.linkedin.text.substring(0, 400).replace(/\n/g, ' ');
            promptToUse = `Create a professional, corporate style image for a LinkedIn post about: ${summary}. No text in image.`;
        }
        else if (activeTab === 'twitter' && finalContent.twitter?.thread?.[0]) {
            promptToUse = `Digital art illustration for a tweet about: ${finalContent.twitter.thread[0]}. Modern, tech style.`;
        }
        else if (activeTab === 'blog' && finalContent.blog?.title) {
            promptToUse = `Editorial style header image for a blog post titled "${finalContent.blog.title}". Professional cybersecurity context.`;
        }
        else if (activeTab === 'instagram' && finalContent.instagram?.caption) {
            const caption = finalContent.instagram.caption.substring(0, 300).replace(/\n/g, ' ');
            promptToUse = `Instagram photo for this caption: ${caption}. High quality photography.`;
        }
        // 3. Fallback to the main analysis topic
        else if (data?.analysis.topic) {
            promptToUse = `Professional corporate photography concept representing: ${data.analysis.topic}. High tech, secure, business style.`;
        } else {
            promptToUse = "Corporate cybersecurity office environment, professional and modern.";
        }

        try {
            const url = await generateImageAction(promptToUse);
            setGeneratedImageUrl(url);
        } catch (error) {
            console.error(error);
            alert("Error generando la imagen.");
        } finally {
            setGeneratingImage(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#16313a] to-slate-900 z-0 text-white p-6" />

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">

                {/* Main Card Container (Input) */}
                <div className="relative z-20 bg-white rounded-[32px] shadow-2xl max-w-3xl mx-auto overflow-hidden border border-slate-100 mb-8">

                    {/* Header inside Card */}
                    <div className="bg-[#16313a] p-8 text-center bg-[url('/grid-pattern.svg')]">
                        <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight text-[#ffe008]">Agente de Contenidos Xeoris</h1>
                        <p className="text-slate-300 text-sm md:text-base opacity-90">Tu estratega de marketing digital con IA.</p>
                    </div>

                    <div className="p-6 md:p-10 space-y-6">
                        {/* URL Input Group (unchanged logic, just ensuring context) */}
                        <div className="space-y-2 text-center">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Fuente de la Noticia</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <ExternalLink size={16} className="text-slate-400 group-focus-within:text-[#ffe008] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="https://ejemplo.com/noticia-ciberseguridad"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 placeholder:text-slate-400 text-sm font-medium focus:ring-2 focus:ring-[#ffe008] focus:bg-white transition-all shadow-sm text-center"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                                />
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <button
                                onClick={handleProcess}
                                disabled={loading || !url}
                                className={`flex-1 py-3 px-6 rounded-full font-bold text-[#16313a] text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                                    ${loading
                                        ? 'bg-slate-200 cursor-wait text-slate-500'
                                        : 'bg-[#ffe008] hover:bg-[#ffe008] active:scale-95'}`}
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                {loading ? 'Analizando...' : 'Analizar Noticia'}
                            </button>

                            <button
                                onClick={() => setShowInstructions(!showInstructions)}
                                className={`py-3 px-5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 border
                                    ${showInstructions
                                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Settings2 size={16} />
                            </button>
                        </div>

                        {/* Prompt Manager */}
                        <AnimatePresence>
                            {showInstructions && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mt-2 space-y-4">
                                        <div className="flex flex-col items-center gap-2 pb-2 border-b border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide text-center">
                                                Configuración de Estilo
                                            </h3>
                                            <select
                                                onChange={(e) => {
                                                    const p = savedPrompts.find(sp => sp.id === Number(e.target.value));
                                                    if (p) {
                                                        setCustomInstructions(p.content);
                                                        setPromptName(p.name);
                                                    } else {
                                                        setCustomInstructions('');
                                                        setPromptName('');
                                                    }
                                                }}
                                                className="text-xs border border-slate-300 rounded-lg py-1 px-2 bg-white"
                                            >
                                                <option value="">📂 Cargar Estilo...</option>
                                                {savedPrompts.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <textarea
                                            value={customInstructions}
                                            onChange={(e) => setCustomInstructions(e.target.value)}
                                            placeholder="Instrucciones personalizadas (Ej: tono irónico, enfocado a PYMES...)"
                                            className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-1 focus:ring-[#ffe008] outline-none resize-none"
                                        />

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nombre del estilo..."
                                                className="flex-1 p-2 text-xs border border-slate-200 rounded-lg bg-white"
                                                value={promptName}
                                                onChange={(e) => setPromptName(e.target.value)}
                                            />
                                            <button
                                                onClick={handleSavePrompt}
                                                disabled={!promptName || !customInstructions}
                                                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 disabled:opacity-50"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Status Bar */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                className="bg-slate-50 border-t border-slate-100 p-3 text-center"
                            >
                                <p className="text-slate-500 font-mono text-sm flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin text-blue-500" /> {status}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- RESULTS STACK --- */}
                <AnimatePresence mode="wait">
                    {data && !loading && (
                        <div className="max-w-3xl mx-auto space-y-6">

                            {/* Card 1: Analysis Summary */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 text-center"
                            >
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center justify-center gap-2 text-lg">
                                    <CheckCircle size={20} className="text-[#ffe008]" />
                                    Análisis Realizado
                                </h3>

                                <div className="space-y-4 text-sm max-w-xl mx-auto">
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <p className="font-semibold text-slate-700 mb-1">Tema Principal</p>
                                        <p className="text-slate-600">{data.analysis.topic}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-700 mb-2">Hechos Clave</p>
                                        <ul className="space-y-2 inline-block text-left">
                                            {data.analysis.keyFacts.map((fact, i) => (
                                                <li key={i} className="text-slate-500 flex gap-2 items-start">
                                                    <span className="text-[#ffe008] text-xs mt-1">●</span> {fact}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <a href={data.original.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1">
                                            Fuente: {data.original.source} <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2: Audience Selector */}
                            {!selectedVariation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 text-center"
                                >
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide mb-6 flex items-center justify-center gap-2">
                                        <span className="bg-[#16313a] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                        Selecciona tu Audiencia Objetivo
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { id: 'technology_partners', label: 'Partners IT', icon: '🛠', desc: 'MSPs, Resellers' },
                                            { id: 'insurance_brokers', label: 'Corredores', icon: '🛡', desc: 'Brokers' },
                                            { id: 'data_protection', label: 'Protección Datos', icon: '⚖️', desc: 'DPOs' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setAudience(opt.id)}
                                                className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg
                                                    ${audience === opt.id
                                                        ? 'border-[#ffe008] bg-[#ffe008]/10 shadow-lg scale-[1.02]'
                                                        : 'border-slate-200 bg-white hover:border-[#ffe008]/50'}`}
                                            >
                                                <div className={`text-3xl mb-3 transition-transform duration-300 ${audience === opt.id ? 'scale-110' : 'grayscale opacity-50'}`}>
                                                    {opt.icon}
                                                </div>
                                                <p className={`font-black text-sm mb-1 leading-tight ${audience === opt.id ? 'text-[#16313a]' : 'text-slate-700'}`}>
                                                    {opt.label}
                                                </p>
                                                {/* Selection Indicator */}
                                                <div className={`mt-2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                                                    ${audience === opt.id ? 'border-[#ffe008] bg-[#ffe008]' : 'border-slate-300'}`}>
                                                    {audience === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-[#16313a]" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Card 3: Variation Selector */}
                            {!selectedVariation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 text-center"
                                >
                                    <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-4 flex justify-center items-center gap-2 mb-6">
                                        <span className="bg-[#16313a] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                        Selecciona un Enfoque
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {data.variations.map((v, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelectVariation(v.angle)}
                                                className="p-6 rounded-2xl border-2 flex flex-col items-center text-center transition-all border-slate-100 bg-white hover:border-[#ffe008] hover:shadow-lg group"
                                            >
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md mb-3 inline-block
                                                    ${v.angle.toLowerCase().includes('urgent') ? 'bg-red-50 text-red-600' :
                                                        v.angle.toLowerCase().includes('edu') ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}
                                                `}>
                                                    {v.angle}
                                                </span>
                                                <h4 className="font-bold text-slate-800 mb-2 leading-tight text-sm">{v.headline}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-3">{v.body}</p>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}


                            {/* Step 2: Final Content Display */}
                            {selectedVariation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
                                >
                                    <div className="bg-[#16313a] text-white p-6 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setSelectedVariation(null)} className="text-white/50 hover:text-white transition-colors">
                                                ← Cambiar Enfoque
                                            </button>
                                            <h3 className="text-lg font-bold">Contenido Multicanal</h3>
                                        </div>
                                        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-[#ffe008]">
                                            Enfoque: {selectedVariation}
                                        </span>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
                                        {[
                                            { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                                            { id: 'twitter', icon: Twitter, label: 'X / Twitter' },
                                            { id: 'instagram', icon: Instagram, label: 'Instagram' },
                                            { id: 'blog', icon: FileText, label: 'Blog Post' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all
                                                        ${activeTab === tab.id
                                                        ? 'border-[#ffe008] text-[#16313a] bg-white'
                                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                                                    `}
                                            >
                                                <tab.icon size={18} /> {tab.label}
                                                {/* Status Dot */}
                                                {finalContent[tab.id as keyof PlatformContent] ? (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full bg-slate-300 ml-1" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Main Content Area Grid */}
                                    <div className="grid md:grid-cols-12 gap-0">

                                        {/* Text Content (Left) */}
                                        <div className="md:col-span-7 p-8 border-r border-slate-100 min-h-[400px]">

                                            {/* ON DEMAND GENERATION PLACEHOLDER */}
                                            {!finalContent[activeTab] && (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                                                        <Sparkles size={32} className="text-slate-400" />
                                                    </div>
                                                    <p className="mb-6 max-w-xs mx-auto">
                                                        Aún no has generado el contenido para <strong>{activeTab.toUpperCase()}</strong>.
                                                    </p>
                                                    <button
                                                        onClick={() => handleGeneratePlatform(activeTab)}
                                                        disabled={generatingPlatform === activeTab}
                                                        className="px-8 py-3 bg-[#ffe008] text-[#16313a] font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                                    >
                                                        {generatingPlatform === activeTab ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                                        Generar para {activeTab}
                                                    </button>
                                                </div>
                                            )}

                                            {/* CONTENT DISPLAY (If Exists) */}
                                            {finalContent[activeTab] && (
                                                <>
                                                    {activeTab === 'linkedin' && finalContent.linkedin && (
                                                        <div className="space-y-4">
                                                            <div className="bg-slate-50 p-6 border border-slate-200 rounded-xl whitespace-pre-line text-slate-700 leading-relaxed shadow-sm text-sm">
                                                                {finalContent.linkedin.text}
                                                            </div>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {finalContent.linkedin.hashtags.map((h, i) => (
                                                                    <span key={i} className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded">#{h}</span>
                                                                ))}
                                                            </div>
                                                            <button onClick={() => copyToClipboard(finalContent.linkedin!.text)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex justify-center gap-2">
                                                                <Copy size={18} /> Copiar LinkedIn
                                                            </button>
                                                        </div>
                                                    )}

                                                    {activeTab === 'twitter' && finalContent.twitter && (
                                                        <div className="space-y-6">
                                                            {finalContent.twitter.thread.map((tweet, i) => (
                                                                <div key={i} className="relative pl-8 border-l-2 border-slate-200">
                                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white" />
                                                                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl shadow-sm text-slate-700 text-sm mb-2">
                                                                        {tweet}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <button
                                                                            onClick={() => copyToClipboard(tweet)}
                                                                            className="text-xs text-slate-400 hover:text-blue-500 inline-flex items-center gap-1"
                                                                        >
                                                                            <Copy size={12} /> Copiar
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {activeTab === 'instagram' && finalContent.instagram && (
                                                        <div className="space-y-4">
                                                            <div className="bg-slate-50 p-6 border border-slate-200 rounded-xl whitespace-pre-line text-slate-700 leading-relaxed shadow-sm text-sm">
                                                                {finalContent.instagram.caption}
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(finalContent.instagram!.caption)}
                                                                className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold transition-colors flex justify-center gap-2"
                                                            >
                                                                <Copy size={18} /> Copiar Caption
                                                            </button>
                                                        </div>
                                                    )}

                                                    {activeTab === 'blog' && finalContent.blog && (
                                                        <div className="space-y-6">
                                                            <div className="border-b pb-4 mb-4">
                                                                <h2 className="text-2xl font-black text-slate-900 mb-2">{finalContent.blog.title}</h2>
                                                                <div className="flex gap-2">
                                                                    {finalContent.blog.seoKeywords.map((kw, i) => (
                                                                        <span key={i} className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-500 font-mono">
                                                                            {kw}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="prose prose-slate prose-sm max-w-none h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                                <div dangerouslySetInnerHTML={{ __html: finalContent.blog.content.replace(/\n/g, '<br/>') }} />
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(finalContent.blog!.content)}
                                                                className="w-full py-3 bg-[#16313a] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#16313a]/90"
                                                            >
                                                                <Copy size={18} /> Copiar Artículo
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Image Generator (Right Column) */}
                                        <div className="md:col-span-5 p-8 bg-slate-50/50 flex flex-col">
                                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <ImageIcon size={18} className="text-blue-500" />
                                                Imagen Sugerida
                                            </h4>

                                            <div className="flex-1 bg-slate-200 rounded-2xl border-2 border-dashed border-slate-300 relative overflow-hidden flex items-center justify-center min-h-[300px]">
                                                {generatedImageUrl ? (
                                                    <div className="relative w-full h-full group">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={generatedImageUrl}
                                                            alt="Generated content"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                            <a href={generatedImageUrl} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform">
                                                                <ExternalLink size={20} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-6 text-slate-400">
                                                        <Sparkles size={48} className="mx-auto mb-4 opacity-30" />
                                                        <p className="text-sm">Genera una imagen original (DALL-E 3) para acompañar este contenido.</p>
                                                    </div>
                                                )}

                                                {generatingImage && (
                                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="text-center">
                                                            <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
                                                            <p className="text-sm font-bold text-slate-600">Creando Imagen...</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4">
                                                {finalContent.instagram?.visualPrompt && (
                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-500 italic mb-4">
                                                        Prompt Visual: "{finalContent.instagram.visualPrompt}"
                                                    </div>
                                                )}
                                                <button
                                                    onClick={handleGenerateImage}
                                                    disabled={generatingImage}
                                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                                                            ${generatingImage
                                                            ? 'bg-slate-300 cursor-wait'
                                                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'}`}
                                                >
                                                    <Sparkles size={18} />
                                                    {generatedImageUrl ? 'Regenerar Imagen' : 'Generar Imagen IA'}
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </main >
        </div >
    );
}
