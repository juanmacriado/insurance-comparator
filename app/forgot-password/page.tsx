
'use client';

import { useState } from 'react';
import { forgotPassword } from '@/lib/password-actions';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

export default function ForgotPasswordPage() {
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        const res = await forgotPassword(formData);
        if (res.message) setMessage(res.message);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200 dark:bg-indigo-900 blur-[130px] rounded-full"></div>
            </div>

            <div className="glass-card max-w-md w-full p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 dark:bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-primary dark:text-white" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-primary dark:text-white uppercase tracking-tight">
                        Recuperar Contraseña
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">
                        Te enviaremos un enlace a tu correo
                    </p>
                </div>

                {message ? (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 p-6 rounded-xl text-center border border-green-100 dark:border-green-900/50">
                        <p className="font-bold text-sm">{message}</p>
                        <Link href="/login" className="mt-4 inline-block font-bold text-xs uppercase tracking-widest text-primary dark:text-white border-b-2 border-secondary hover:text-indigo-600 transition-colors">
                            Volver a Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 ml-1" htmlFor="email">
                                Correo Electrónico Registrado
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:border-primary dark:focus:border-indigo-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-slate-800 dark:text-slate-200"
                                type="email"
                                name="email"
                                required
                                placeholder="juan@ejemplo.com"
                            />
                        </div>

                        <SubmitButton />

                        <div className="text-center">
                            <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary dark:hover:text-white uppercase tracking-widest transition-all">
                                <ArrowLeft className="w-3 h-3" /> Volver
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-primary hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
            {pending ? 'Enviando...' : 'Enviar Enlace'}
        </button>
    );
}
