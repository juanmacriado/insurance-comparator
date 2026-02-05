'use client';

import { ShieldCheck, ArrowRight, FileStack, ClipboardCheck, Percent, KeyRound } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-white text-[#16313a] selection:bg-[#ffe008] selection:text-[#16313a] overflow-x-hidden">
            {/* Background Graphic */}
            <div className="xeoris-bg-image opacity-20">
                <Image
                    src="/background-xeoris.png"
                    alt="Xeoris Background"
                    width={1000}
                    height={800}
                    className="w-full h-auto"
                    priority
                />
            </div>



            <div className="container mx-auto px-6 pt-36 pb-20 relative z-10 max-w-6xl">
                {/* Hero Section */}
                <div className="flex flex-col items-center mb-16 animate-in fade-in duration-1000">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-[#16313a] text-center leading-[1.1]">
                        Xeoris te hace <br />
                        {/* User request: Highlight in Yellow background */}
                        <span className="text-[#16313a] bg-[#ffe008] px-6 py-2 rounded-[30px] inline-block mt-4 shadow-xl italic">la vida más Fácil</span>
                    </h1>
                    <p className="text-[#16313a]/40 text-lg uppercase tracking-[0.3em] font-black text-center mt-6">
                        Soluciones Inteligentes para tu Empresa
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20">
                    {/* Option: Policy Comparator */}
                    <Link href="/comparator" className="group">
                        <div className="bg-white border-2 border-gray-100 p-8 rounded-[40px] shadow-xl hover:shadow-2xl hover:border-[#ffe008] transition-all duration-500 h-full flex flex-col items-center text-center">
                            <div className="bg-[#16313a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#ffe008] transition-colors duration-500">
                                <ClipboardCheck className="w-8 h-8 text-[#16313a]" />
                            </div>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">Comparador de Pólizas</h2>
                            <p className="text-[#16313a]/60 text-base mb-12">Analiza y compara coberturas de ciberseguro con Inteligencia Artificial.</p>

                            <div className="mt-auto flex items-center gap-2 font-black text-[#16313a] uppercase tracking-widest text-[10px]">
                                Empezar Análisis <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Option: PDF Unifier */}
                    <Link href="/unificador" className="group">
                        <div className="bg-white border-2 border-gray-100 p-8 rounded-[40px] shadow-xl hover:shadow-2xl hover:border-[#ffe008] transition-all duration-500 h-full flex flex-col items-center text-center">
                            <div className="bg-[#16313a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#ffe008] transition-colors duration-500">
                                <FileStack className="w-8 h-8 text-[#16313a]" />
                            </div>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">Unificador de PDF</h2>
                            <p className="text-[#16313a]/60 text-base mb-12">Une múltiples documentos en un solo PDF de forma rápida y sencilla.</p>

                            <div className="mt-auto flex items-center gap-2 font-black text-[#16313a] uppercase tracking-widest text-[10px]">
                                Unir Documentos <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Option: Commission Management */}
                    <Link href="/comisiones" className="group">
                        <div className="bg-white border-2 border-gray-100 p-8 rounded-[40px] shadow-xl hover:shadow-2xl hover:border-[#ffe008] transition-all duration-500 h-full flex flex-col items-center text-center">
                            <div className="bg-[#16313a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#ffe008] transition-colors duration-500">
                                <Percent className="w-8 h-8 text-[#16313a]" />
                            </div>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">Gestión de Comisiones</h2>
                            <p className="text-[#16313a]/60 text-base mb-12">Administra los porcentajes de comisión y acuerdos con aseguradoras.</p>

                            <div className="mt-auto flex items-center gap-2 font-black text-[#16313a] uppercase tracking-widest text-[10px]">
                                Gestionar Acuerdos <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Option: Social Media Agent */}
                    <Link href="/social-media" className="group">
                        <div className="bg-white border-2 border-gray-100 p-8 rounded-[40px] shadow-xl hover:shadow-2xl hover:border-[#ffe008] transition-all duration-500 h-full flex flex-col items-center text-center">
                            <div className="bg-[#16313a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#ffe008] transition-colors duration-500">
                                <ShieldCheck className="w-8 h-8 text-[#16313a]" />
                            </div>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">Agente Social Media</h2>
                            <p className="text-[#16313a]/60 text-base mb-12">Genera contenido para redes sociales a partir de noticias de ciberseguridad.</p>

                            <div className="mt-auto flex items-center gap-2 font-black text-[#16313a] uppercase tracking-widest text-[10px]">
                                Crear Posts <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Option: User Management (Admin) */}
                    <Link href="/admin/users" className="group">
                        <div className="bg-white border-2 border-gray-100 p-8 rounded-[40px] shadow-xl hover:shadow-2xl hover:border-[#ffe008] transition-all duration-500 h-full flex flex-col items-center text-center">
                            <div className="bg-[#16313a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#ffe008] transition-colors duration-500">
                                <KeyRound className="w-8 h-8 text-[#16313a]" />
                            </div>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">Gestión de Usuarios</h2>
                            <p className="text-[#16313a]/60 text-base mb-12">Administración de accesos y permisos del portal.</p>

                            <div className="mt-auto flex items-center gap-2 font-black text-[#16313a] uppercase tracking-widest text-[10px]">
                                Gestionar Accesos <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    );
}
