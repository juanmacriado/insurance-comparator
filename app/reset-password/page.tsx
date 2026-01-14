
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-red-50 text-red-500 p-6 rounded-xl font-bold border border-red-100">
                    Token no válido o ausente.
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-[#16313a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-[#16313a]" />
                    </div>
                    <h1 className="text-2xl font-black text-[#16313a] uppercase tracking-tight">Nueva Contraseña</h1>
                </div>

                {success ? (
                    <div className="text-center py-6">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-[#16313a] mb-2">¡Contraseña Actualizada!</h2>
                        <p className="text-gray-500 text-sm mb-6">Ya puedes acceder con tu nueva clave.</p>
                        <Link href="/login" className="bg-[#16313a] text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transition-all">
                            Ir a Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1" htmlFor="password">
                                Nueva Contraseña
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#ffe008] focus:ring-2 focus:ring-[#ffe008]/20 outline-none transition-all font-bold text-sm"
                                type="password"
                                name="password"
                                required
                                minLength={3}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1" htmlFor="confirmPassword">
                                Confirmar Contraseña
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#ffe008] focus:ring-2 focus:ring-[#ffe008]/20 outline-none transition-all font-bold text-sm"
                                type="password"
                                name="confirmPassword"
                                required
                                minLength={3}
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-lg border border-red-100">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#16313a] hover:bg-[#1e424d] text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
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
