
import { auth } from "@/auth";
import { createUser, deleteUser, getUsers } from "@/lib/user-actions";
import { redirect } from "next/navigation";
import { UserPlus, Trash2, Shield, User } from "lucide-react";
// import { UserList } from "./user-list"; // I'll inline it for simplicity or create separate client component if needed for interactivity

export default async function UsersPage() {
    const session = await auth();

    if (session?.user?.role !== 'admin') {
        redirect('/comisiones'); // Or 403 page
    }

    const users = await getUsers();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-black text-[#16313a] uppercase tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-gray-500 font-medium">Administra quién tiene acceso al sistema.</p>
                </div>

                {/* Create User Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-[#16313a] mb-6 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-[#ffe008]" />
                        Crear Nuevo Usuario
                    </h2>
                    <form action={async (formData) => {
                        'use server';
                        await createUser(formData);
                    }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">Nombre</label>
                            <input name="name" type="text" placeholder="Ej: Juan Pérez" className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:border-[#ffe008] outline-none" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">Email</label>
                            <input name="email" type="email" placeholder="usuario@ejemplo.com" className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:border-[#ffe008] outline-none" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">Contraseña</label>
                            <input name="password" type="password" placeholder="••••••••" className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:border-[#ffe008] outline-none" required minLength={3} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">Rol</label>
                            <select name="role" className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:border-[#ffe008] outline-none">
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 pt-2">
                            <button type="submit" className="bg-[#16313a] text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-lg transition-all w-full md:w-auto">
                                Crear Usuario
                            </button>
                        </div>
                    </form>
                </div>

                {/* Users List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Usuario</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Rol</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha Registro</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user: any) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#16313a] text-sm">{user.name || 'Sin Nombre'}</div>
                                            <div className="text-xs text-gray-400 font-medium">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${user.role === 'admin'
                                                ? 'bg-[#ffe008]/10 text-[#16313a] border-[#ffe008]/20'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}>
                                                {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <form action={async () => {
                                                'use server';
                                                await deleteUser(user.id);
                                            }}>
                                                <button type="submit" className="text-gray-300 hover:text-red-500 transition-colors p-2" disabled={user.email === session.user.email}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
