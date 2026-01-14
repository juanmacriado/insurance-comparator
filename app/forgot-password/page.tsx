
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-[#16313a]/5 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-[#16313a]" />
                    </div>
                    <h1 className="text-2xl font-black text-[#16313a] uppercase tracking-tight">Recuperar Contraseña</h1>
                    <p className="text-gray-400 text-sm font-bold mt-2">Te enviaremos un enlace a tu correo</p>
                </div>

                {message ? (
                    <div className="bg-green-50 text-green-600 p-6 rounded-xl text-center">
                        <p className="font-bold text-sm">{message}</p>
                        <Link href="/login" className="mt-4 inline-block font-black text-xs uppercase tracking-widest text-[#16313a] border-b-2 border-[#ffe008]">
                            Volver a Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1" htmlFor="email">
                                Correo Electrónico Registrado
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#ffe008] focus:ring-2 focus:ring-[#ffe008]/20 outline-none transition-all font-bold text-sm"
                                type="email"
                                name="email"
                                required
                                placeholder="juan@ejemplo.com"
                            />
                        </div>

                        <SubmitButton />

                        <div className="text-center">
                            <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#16313a] uppercase tracking-widest transition-all">
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
            className="w-full bg-[#16313a] hover:bg-[#1e424d] text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
            {pending ? 'Enviando...' : 'Enviar Enlace'}
        </button>
    );
}
