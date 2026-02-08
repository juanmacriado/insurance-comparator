
'use client';

import { useState, Suspense } from 'react';
import { resetPassword } from '@/lib/password-actions';
import { Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        if (token) formData.append('token', token);

        const res = await resetPassword(formData);

        if (res.error) {
            setError(res.error);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-200 dark:bg-red-900 blur-[120px] rounded-full"></div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-300 p-6 rounded-xl font-bold border border-red-100 dark:border-red-900/50 backdrop-blur-sm">
                    Token no válido o ausente.
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20 pointer-events-none">
                <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-green-200 dark:bg-green-900 blur-[120px] rounded-full"></div>
            </div>

            <div className="glass-card max-w-md w-full p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 dark:bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary dark:text-white" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-primary dark:text-white uppercase tracking-tight">
                        Nueva Contraseña
                    </h1>
                </div>

                {success ? (
                    <div className="text-center py-6">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-primary dark:text-white mb-2">¡Contraseña Actualizada!</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Ya puedes acceder con tu nueva clave.</p>
                        <Link href="/login" className="bg-primary text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:bg-indigo-900 transition-all inline-block">
                            Ir a Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 ml-1" htmlFor="password">
                                Nueva Contraseña
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:border-primary dark:focus:border-indigo-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-slate-800 dark:text-slate-200"
                                type="password"
                                name="password"
                                required
                                minLength={3}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 ml-1" htmlFor="confirmPassword">
                                Confirmar Contraseña
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:border-primary dark:focus:border-indigo-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm text-slate-800 dark:text-slate-200"
                                type="password"
                                name="confirmPassword"
                                required
                                minLength={3}
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-300 text-xs font-bold p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
