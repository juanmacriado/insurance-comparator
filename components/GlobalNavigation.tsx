'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Menu, X, ChevronDown, LayoutGrid, FileStack, ClipboardCheck, Percent, Share2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalNavigation() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Don't show generic nav if we want a specific landing page header, 
    // BUT the user asked for this link on ALL pages. 
    // So we will standardize the header across the app.

    const navItems = [
        { name: 'Comparador', href: '/comparator', icon: ClipboardCheck },
        { name: 'Unificador', href: '/unificador', icon: FileStack },
        { name: 'Comisiones', href: '/comisiones', icon: Percent },
        { name: 'Social Media', href: '/social-media', icon: Share2 },
        { name: 'Admin', href: '/admin/users', icon: KeyRound },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 bg-[#16313a] z-50 py-4 shadow-lg">
            <div className="container mx-auto px-6 h-12 flex justify-between items-center">
                {/* Brand Logo - Always goes to Home */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-white/10 p-2 rounded-xl shadow-lg transition-transform group-hover:scale-105 border border-white/10">
                        <ShieldCheck className="w-5 h-5 text-[#ffe008]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter text-white leading-none">XEORIS</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#ffe008] leading-none">Portal</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                    ${isActive
                                        ? 'bg-[#ffe008] text-[#16313a] shadow-[0_0_15px_rgba(255,224,8,0.3)]'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <item.icon size={14} strokeWidth={2.5} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Navigation Dropdown */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden border-t border-white/10 bg-[#16313a] overflow-hidden shadow-2xl"
                    >
                        <nav className="flex flex-col p-4 gap-2">
                            <Link
                                href="/"
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname === '/' ? 'bg-[#ffe008] text-[#16313a]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <LayoutGrid size={18} />
                                <span className="font-bold text-sm">Menú Principal</span>
                            </Link>

                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors
                                        ${pathname.startsWith(item.href)
                                            ? 'bg-[#ffe008] text-[#16313a] font-bold shadow-sm'
                                            : 'text-slate-300 hover:bg-white/10 hover:text-white font-medium'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    <span className="text-sm">{item.name}</span>
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
