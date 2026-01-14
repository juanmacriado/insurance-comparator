
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
            // Redirect logic inside authenticate usually throws, so we might not reach here if successful
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-[#16313a] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <LogIn className="w-8 h-8 text-[#ffe008]" />
                    </div>
                    <h1 className="text-2xl font-black text-[#16313a] uppercase tracking-tight">Iniciar Sesión</h1>
                    <p className="text-gray-400 text-sm font-bold mt-2">Introduce tus credenciales para acceder</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1" htmlFor="email">
                            Correo Electrónico
                        </label>
                        <input
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#ffe008] focus:ring-2 focus:ring-[#ffe008]/20 outline-none transition-all font-bold text-sm"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="usuario@ejemplo.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#ffe008] focus:ring-2 focus:ring-[#ffe008]/20 outline-none transition-all font-bold text-sm"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            minLength={3}
                        />
                    </div>

                    {errorMessage && (
                        <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-lg border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {errorMessage}
                        </div>
                    )}

                    <div className="pt-2">
                        <LoginButton />
                    </div>

                    <div className="text-center mt-6">
                        <a href="/forgot-password" className="text-xs font-black text-gray-400 hover:text-[#16313a] uppercase tracking-widest border-b-2 border-transparent hover:border-[#ffe008] transition-all pb-0.5">
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
            className="w-full bg-[#16313a] hover:bg-[#1e424d] text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            aria-disabled={pending}
        >
            {pending ? 'Entrando...' : 'Entrar al Portal'}
        </button>
    );
}
