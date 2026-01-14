
import { auth } from "@/auth";
import ComisionesClientPage from "./client-page";
import { Users, LogOut } from "lucide-react";
import Link from 'next/link';
import { logout } from "@/lib/auth-actions";

export default async function ComisionesPage() {
    const session = await auth();

    return (
        <>
            {/* Header extension for authenticated user */}
            <div className="fixed top-5 right-6 z-[60] flex items-center gap-3">
                {session?.user?.role === 'admin' && (
                    <Link
                        href="/admin/users"
                        className="bg-[#ffe008] hover:bg-[#ffe008]/90 text-[#16313a] px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all flex items-center gap-2"
                    >
                        <Users className="w-3 h-3" /> Usuarios
                    </Link>
                )}

                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg border border-gray-100 flex items-center gap-3">
                    <span className="text-gray-400">
                        {session?.user?.name || session?.user?.email}
                    </span>
                    <form action={logout}>
                        <button className="text-red-400 hover:text-red-500 transition-colors flex items-center gap-1">
                            <LogOut className="w-3 h-3" /> Salir
                        </button>
                    </form>
                </div>
            </div>

            <ComisionesClientPage />
        </>
    );
}
