
'use client';

import { useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/auth-actions';
import { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage(null);
        const formData = new FormData(event.currentTarget);
        try {
            const result = await authenticate(undefined, formData);
            if (result) {
                setErrorMessage(result);
            }
        } catch (e) {
            // Redirect logic inside authenticate usually throws
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background elements to enhance glass effect */}
            <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20 pointer-events-none">
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-300 dark:bg-indigo-900 blur-[120px] rounded-full"></div>
                <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-yellow-200 dark:bg-yellow-900/30 blur-[100px] rounded-full"></div>
            </div>

            <div className="glass-card max-w-md w-full p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 dark:bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <LogIn className="w-8 h-8 text-primary dark:text-white" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-primary dark:text-white uppercase tracking-tight">
                        Iniciar Sesión
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">
                        Introduce tus credenciales para acceder al Portal Xeoris
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 ml-1" htmlFor="email">
                            Correo Electrónico
                        </label>
                        <input
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:border-primary dark:focus:border-indigo-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-slate-800 dark:text-slate-200"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="usuario@ejemplo.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 ml-1" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:border-primary dark:focus:border-indigo-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-slate-800 dark:text-slate-200"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            minLength={3}
                        />
                    </div>

                    {errorMessage && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-300 text-xs font-bold p-3 rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2">
                            <span>⚠️</span> {errorMessage}
                        </div>
                    )}

                    <div className="pt-2">
                        <LoginButton />
                    </div>

                    <div className="text-center mt-6">
                        <a href="/forgot-password" className="text-xs font-bold text-slate-400 hover:text-primary dark:hover:text-indigo-400 uppercase tracking-widest transition-all">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <button
            className="w-full bg-primary hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            aria-disabled={pending}
        >
            {pending ? 'Entrando...' : 'Entrar al Portal'}
        </button>
    );
}
