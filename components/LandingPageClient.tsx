'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Users, LogOut } from "lucide-react";
import { logout } from "@/lib/auth-actions";

export default function LandingPageClient({ session }: { session: any }) {
    // Dark mode state implementation matching the portal.html logic
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check system preference or localStorage if we were persisting it
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <>
            {/* Nav - from portal.html */}
            <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center glass-card border-b transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-2xl">verified_user</span>
                    </div>
                    <span className="font-display text-xl font-bold tracking-tight text-primary dark:text-white uppercase transition-colors duration-300">
                        Xeoris <span className="font-light opacity-70">Portal</span>
                    </span>
                </div>

                {/* User Session Info / Buttons */}
                {session?.user ? (
                    <div className="flex items-center gap-3">
                        {session?.user?.role === 'admin' && (
                            <Link
                                href="/admin/users"
                                className="bg-secondary hover:bg-yellow-300 text-primary px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg transition-all flex items-center gap-2"
                            >
                                <Users className="w-3 h-3" /> Usuarios
                            </Link>
                        )}

                        <div className="glass-card px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                            <span>
                                {session?.user?.name || session?.user?.email}
                            </span>
                            <form action={logout}>
                                <button className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-1 ml-2 border-l border-slate-300 dark:border-slate-600 pl-3">
                                    <LogOut className="w-3 h-3" /> Salir
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <Link href="/login" className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-primary text-secondary hover:bg-primary/90 transition-colors shadow-md">
                        Iniciar Sesión
                    </Link>
                )}
            </nav>

            {/* Header - from portal.html */}
            <header className="pt-32 pb-12 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-10 pointer-events-none transition-opacity duration-300">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-200 blur-[120px] rounded-full"></div>
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-4 tracking-tight transition-colors duration-300">
                    Xeoris te hace<br />
                    <span className="relative inline-block mt-2">
                        <span className="relative z-10 text-primary dark:text-indigo-400 italic transition-colors duration-300">la vida más Fácil</span>
                        <span className="absolute bottom-1 left-0 w-full h-4 bg-secondary -z-10 rounded-sm opacity-80"></span>
                    </span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium tracking-[0.2em] uppercase mt-6 transition-colors duration-300">
                    Soluciones Inteligentes para tu Empresa
                </p>
            </header>

            {/* Main Content - Grid from portal.html */}
            <main className="max-w-6xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Card 1: Comparador */}
                    <Link href="/comparator">
                        <div className="glass-card p-8 rounded-xl card-hover group cursor-pointer border-2 border-transparent hover:border-primary/20 dark:hover:border-indigo-400/20 shadow-xl shadow-slate-200/50 dark:shadow-none h-full transition-all duration-300">
                            <div className="flex flex-col h-full">
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined text-3xl">fact_check</span>
                                </div>
                                <h3 className="font-display text-2xl font-bold mb-3 text-primary dark:text-white transition-colors duration-300">Comparador de Pólizas</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 transition-colors duration-300">
                                    Analiza y compara coberturas de ciberseguro con Inteligencia Artificial avanzada para optimizar tus decisiones.
                                </p>
                                <div className="mt-auto flex items-center text-primary dark:text-indigo-400 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                                    Empezar Análisis
                                    <span className="material-symbols-outlined ml-2 text-base">arrow_forward_ios</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: Unificador */}
                    <Link href="/unificador">
                        <div className="glass-card p-8 rounded-xl card-hover group cursor-pointer border-2 border-transparent hover:border-primary/20 dark:hover:border-indigo-400/20 shadow-xl shadow-slate-200/50 dark:shadow-none h-full transition-all duration-300">
                            <div className="flex flex-col h-full">
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                                </div>
                                <h3 className="font-display text-2xl font-bold mb-3 text-primary dark:text-white transition-colors duration-300">Unificador de PDF</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 transition-colors duration-300">
                                    Une múltiples documentos en un solo PDF de forma rápida, segura y sencilla con nuestra herramienta optimizada.
                                </p>
                                <div className="mt-auto flex items-center text-primary dark:text-indigo-400 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                                    Unir Documentos
                                    <span className="material-symbols-outlined ml-2 text-base">arrow_forward_ios</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 3: Comisiones */}
                    <Link href="/comisiones">
                        <div className="glass-card p-8 rounded-xl card-hover group cursor-pointer border-2 border-transparent hover:border-primary/20 dark:hover:border-indigo-400/20 shadow-xl shadow-slate-200/50 dark:shadow-none h-full transition-all duration-300">
                            <div className="flex flex-col h-full">
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined text-3xl">percent</span>
                                </div>
                                <h3 className="font-display text-2xl font-bold mb-3 text-primary dark:text-white transition-colors duration-300">Gestión de Comisiones</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 transition-colors duration-300">
                                    Administra los porcentajes de comisión y acuerdos con aseguradoras de forma centralizada y transparente.
                                </p>
                                <div className="mt-auto flex items-center text-primary dark:text-indigo-400 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                                    Gestionar Acuerdos
                                    <span className="material-symbols-outlined ml-2 text-base">arrow_forward_ios</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 4: Social Media */}
                    <Link href="/social-media">
                        <div className="glass-card p-8 rounded-xl card-hover group cursor-pointer border-2 border-transparent hover:border-primary/20 dark:hover:border-indigo-400/20 shadow-xl shadow-slate-200/50 dark:shadow-none h-full transition-all duration-300">
                            <div className="flex flex-col h-full">
                                <div className="mb-6 w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined text-3xl">share</span>
                                </div>
                                <h3 className="font-display text-2xl font-bold mb-3 text-primary dark:text-white transition-colors duration-300">Agente Social Media</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 transition-colors duration-300">
                                    Genera contenido estratégico para redes sociales a partir de las últimas noticias y tendencias de ciberseguridad.
                                </p>
                                <div className="mt-auto flex items-center text-primary dark:text-indigo-400 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                                    Generar Contenido
                                    <span className="material-symbols-outlined ml-2 text-base">arrow_forward_ios</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 5: User Management (Admin) */}
                    {session?.user?.role === 'admin' && (
                        <Link href="/admin/users">
                            <div className="glass-card p-8 rounded-xl card-hover group cursor-pointer border-2 border-transparent hover:border-primary/20 dark:hover:border-indigo-400/20 shadow-xl shadow-slate-200/50 dark:shadow-none h-full transition-all duration-300">
                                <div className="flex flex-col h-full">
                                    <div className="mb-6 w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <span className="material-symbols-outlined text-3xl">manage_accounts</span>
                                    </div>
                                    <h3 className="font-display text-2xl font-bold mb-3 text-primary dark:text-white transition-colors duration-300">Gestión de Usuarios</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 transition-colors duration-300">
                                        Administración de accesos, roles y permisos del portal para mantener la seguridad.
                                    </p>
                                    <div className="mt-auto flex items-center text-primary dark:text-indigo-400 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                                        Gestionar Accesos
                                        <span className="material-symbols-outlined ml-2 text-base">arrow_forward_ios</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}

                </div>
            </main>

            {/* Footer - from portal.html */}
            <footer className="py-8 px-6 text-center border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <div className="flex justify-center items-center gap-8 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <a className="hover:text-primary transition-colors" href="#">Aviso Legal</a>
                    <a className="hover:text-primary transition-colors" href="#">Privacidad</a>
                    <a className="hover:text-primary transition-colors" href="#">Cookies</a>
                </div>
                <p className="mt-4 text-xs text-slate-400 dark:text-slate-600">© {new Date().getFullYear()} Xeoris SL. Todos los derechos reservados.</p>
            </footer>

            {/* Dark Mode Button - from portal.html */}
            <button
                className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 z-50 transition-colors duration-300 hover:scale-110 active:scale-95"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
            >
                <span className={`material-symbols-outlined ${isDarkMode ? 'hidden' : 'block'}`}>dark_mode</span>
                <span className={`material-symbols-outlined ${isDarkMode ? 'block' : 'hidden'} text-secondary`}>light_mode</span>
            </button>
        </>
    );
}
