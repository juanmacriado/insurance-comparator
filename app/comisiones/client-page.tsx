'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, ArrowLeft, Building2, Calendar, ChevronRight, FileText, Download, Filter, Search, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { fetchAseguradoras, fetchRegistros, createAseguradora, createRegistro, editRegistro, removeRegistro } from './actions';
import { cn } from '@/lib/utils';
import React from 'react';

type ViewState = 'LIST' | 'DASHBOARD' | 'DETAILS';

export default function ComisionesClientPage() {
    const [view, setView] = useState<ViewState>('LIST');
    const [aseguradoras, setAseguradoras] = useState<any[]>([]);
    const [selectedAseguradora, setSelectedAseguradora] = useState<any>(null);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [registros, setRegistros] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewAseguradora, setShowNewAseguradora] = useState(false);
    const [nombreAseguradora, setNombreAseguradora] = useState('');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [editingData, setEditingData] = useState<any>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [settlementRange, setSettlementRange] = useState({ start: '', end: '' });
    const [settlementResults, setSettlementResults] = useState<any[]>([]);
    const [isSettlementView, setIsSettlementView] = useState(false);

    useEffect(() => {
        loadAseguradoras();
    }, []);

    async function loadAseguradoras() {
        setLoading(true);
        const data = await fetchAseguradoras();
        setAseguradoras(data);
        setLoading(false);
    }

    async function handleAddAseguradora(e: React.FormEvent) {
        e.preventDefault();
        if (!nombreAseguradora) return;
        await createAseguradora(nombreAseguradora);
        setNombreAseguradora('');
        setShowNewAseguradora(false);
        loadAseguradoras();
    }

    async function handleSelectAseguradora(asig: any) {
        setSelectedAseguradora(asig);
        setView('DASHBOARD');
    }

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        cliente: '',
        situacion: '',
        tipo_pago: '',
        numero_poliza: '',
        fecha_efecto: '',
        pago_hiscox: '',
        producto: ''
    });

    const filteredRegistros = registros.filter(reg => {
        const matches = (field: string, value: string) => {
            if (!value) return true;
            const regValue = String(reg[field] || '').toLowerCase();
            return regValue.includes(value.toLowerCase());
        };

        return (
            matches('cliente', filters.cliente) &&
            matches('situacion', filters.situacion) &&
            matches('tipo_pago', filters.tipo_pago) &&
            matches('numero_poliza', filters.numero_poliza) &&
            matches('fecha_efecto', filters.fecha_efecto) &&
            matches('pago_hiscox', filters.pago_hiscox) &&
            matches('producto', filters.producto)
        );
    });

    async function handleSelectCategory(cat: string) {
        setSelectedCategory(cat);
        setLoading(true);
        // Fetch ALL records (year = null)
        const data = await fetchRegistros(selectedAseguradora.id, null, cat);
        setRegistros(data);
        setView('DETAILS');
        setLoading(false);
        setExpandedRow(null);
        // Reset filters when changing category
        setFilters({
            cliente: '',
            situacion: '',
            tipo_pago: '',
            numero_poliza: '',
            fecha_efecto: '',
            pago_hiscox: '',
            producto: ''
        });
    }

    async function handleSaveRow(id: number) {
        if (!editingData) return;
        await editRegistro(id, editingData);
        setExpandedRow(null);
        setEditingData(null);
        handleSelectCategory(selectedCategory); // Refresh
    }

    async function handleDeleteRow(id: number) {
        if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
        await removeRegistro(id);
        handleSelectCategory(selectedCategory); // Refresh
    }

    async function handleAddNew() {
        if (!editingData) return;
        await createRegistro({
            ...editingData,
            aseguradora_id: selectedAseguradora.id,
            año: selectedYear,
            tipo_registro: selectedCategory
        });
        setIsAddingNew(false);
        setEditingData(null);
        handleSelectCategory(selectedCategory); // Refresh
    }

    async function handleGenerateSettlement() {
        if (!settlementRange.start || !settlementRange.end) return;

        setLoading(true);
        // We need ALL records for this insurer to apply the logic
        const allData = await fetchRegistros(selectedAseguradora.id, null, null); // Modify action if needed or fetch per category

        const start = new Date(settlementRange.start);
        const end = new Date(settlementRange.end);

        const results: any[] = [];

        allData.forEach((reg: any) => {
            if (reg.situacion?.toUpperCase() !== 'ALTA') return;

            const effectDate = new Date(reg.fecha_efecto);

            if (reg.tipo_pago?.toUpperCase() === 'ANUAL') {
                // Annual logic: month/day in range
                if (isDayMonthInRange(effectDate, start, end)) {
                    results.push({ ...reg, settlementLabel: 'ANUAL' });
                }
            } else if (reg.tipo_pago?.toUpperCase() === 'MENSUAL') {
                // Monthly logic: expansion
                const monthsInSettlement = getMonthsInRange(effectDate, start, end);
                monthsInSettlement.forEach(mLabel => {
                    results.push({ ...reg, settlementLabel: mLabel });
                });
            }
        });

        setSettlementResults(results);
        setIsSettlementView(true);
        setShowSettlementModal(false);
        setLoading(false);
    }

    function isDayMonthInRange(date: Date, start: Date, end: Date) {
        const m = date.getMonth();
        const d = date.getDate();

        // Simplified check: convert to a comparable number (MMDD)
        const currentMMDD = (m + 1) * 100 + d;
        const startMMDD = (start.getMonth() + 1) * 100 + start.getDate();
        const endMMDD = (end.getMonth() + 1) * 100 + end.getDate();

        if (startMMDD <= endMMDD) {
            return currentMMDD >= startMMDD && currentMMDD <= endMMDD;
        } else {
            // Range crosses year boundary
            return currentMMDD >= startMMDD || currentMMDD <= endMMDD;
        }
    }

    function getMonthsInRange(effectDate: Date, start: Date, end: Date) {
        const months = [];
        let curr = new Date(start.getFullYear(), start.getMonth(), 1);
        const finale = new Date(end.getFullYear(), end.getMonth(), 1);

        while (curr <= finale) {
            // Check if effectDate is before or in this month
            if (effectDate <= new Date(curr.getFullYear(), curr.getMonth(), 31)) {
                const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                months.push(`${monthLabels[curr.getMonth()]} ${curr.getFullYear()}`);
            }
            curr.setMonth(curr.getMonth() + 1);
        }
        return months;
    }

    function handleExportSettlement() {
        const table = document.getElementById('settlement-table');
        const wb = XLSX.utils.table_to_book(table);
        XLSX.writeFile(wb, `Liquidacion_${settlementRange.start}_${settlementRange.end}.xlsx`);
    }

    const categories = [
        'Producción'
    ];

    function handleExportData() {
        if (!selectedAseguradora) return;

        const dataToExport = filteredRegistros.map(reg => ({
            'Cliente': reg.cliente,
            'Situación': reg.situacion,
            'Tipo de Pago': reg.tipo_pago,
            'Nº Póliza': reg.numero_poliza,
            'Fecha Efecto': formatDate(reg.fecha_efecto),
            'Pago Asegurador': reg.pago_hiscox,
            'Producto': reg.producto,
            'Prima Neta': reg.prima_neta,
            'Prima Total': reg.prima_total,
            '% Comisión': reg.porcentaje_comision,
            'Neto Comisión': reg.neto_comision,
            'Comp. Prima': reg.comprobacion_prima,
            'Importe a Liquidar': reg.importe_liquidar,
            'Comp. Datos': reg.comprobacion_datos
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Datos");

        // Sanitize filename
        const safeName = selectedAseguradora.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeCategory = selectedCategory.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        XLSX.writeFile(wb, `${safeName}_${safeCategory}_${selectedYear}.xlsx`);
    }

    return (
        <main className="min-h-screen text-slate-900 dark:text-slate-100 selection:bg-secondary selection:text-primary pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-200 dark:border-slate-800 py-4 transition-colors duration-300">
                <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {view !== 'LIST' ? (
                            <button
                                onClick={() => {
                                    if (view === 'DETAILS') setView('DASHBOARD');
                                    else setView('LIST');
                                    setExpandedRow(null);
                                    setIsAddingNew(false);
                                }}
                                className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            </button>
                        ) : (
                            <Link href="/" className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            </Link>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl shadow-lg">
                                <ShieldCheck className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-display font-bold tracking-tight uppercase text-primary dark:text-white">
                                    Aseguradoras
                                </h1>
                                {selectedAseguradora && (
                                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                                        {selectedAseguradora.nombre} {view === 'DETAILS' ? `> ${selectedCategory}` : '> Panel'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {selectedAseguradora && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowSettlementModal(true)}
                                className="bg-secondary text-primary px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all shadow-md"
                            >
                                <Calendar className="w-4 h-4" /> Liquidación
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-24"></div>

            {/* Settlement Selection Modal */}
            {showSettlementModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="glass-card bg-primary dark:bg-slate-900 rounded-[32px] p-10 max-w-lg w-full text-white shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative border border-white/10">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-3xl font-display font-bold uppercase tracking-tight leading-none text-secondary">Periodo de Liquidación</h2>
                                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-3">Define el intervalo de fechas</p>
                            </div>
                            <button
                                onClick={() => setShowSettlementModal(false)}
                                className="absolute top-8 right-8 text-white/50 hover:text-secondary hover:rotate-90 transition-all duration-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-8 mb-10">
                            <div className="flex flex-col gap-3">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-secondary ml-1">Fecha de Inicio</label>
                                <input
                                    type="date"
                                    value={settlementRange.start}
                                    onChange={(e) => setSettlementRange({ ...settlementRange, start: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 font-bold text-lg text-white focus:outline-none focus:border-secondary focus:bg-white/10 transition-all w-full [color-scheme:dark]"
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-secondary ml-1">Fecha Finalización</label>
                                <input
                                    type="date"
                                    value={settlementRange.end}
                                    onChange={(e) => setSettlementRange({ ...settlementRange, end: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 font-bold text-lg text-white focus:outline-none focus:border-secondary focus:bg-white/10 transition-all w-full [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateSettlement}
                            className="w-full bg-secondary text-primary py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm hover:shadow-lg hover:bg-yellow-300 transition-all active:scale-[0.98]"
                        >
                            Generar Liquidación
                        </button>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-6 py-10 max-w-7xl">
                {/* VIEW 1: LIST OF INSURERS */}
                {view === 'LIST' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-3xl font-display font-bold text-primary dark:text-white tracking-tight">Gestión de Aseguradoras</h2>
                            <button
                                onClick={() => setShowNewAseguradora(!showNewAseguradora)}
                                className="bg-primary hover:bg-indigo-900 text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
                            >
                                <Plus className="w-4 h-4" /> Nueva Aseguradora
                            </button>
                        </div>

                        {showNewAseguradora && (
                            <form onSubmit={handleAddAseguradora} className="glass-card p-8 rounded-3xl border border-secondary/20 mb-10 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre de la aseguradora..."
                                        value={nombreAseguradora}
                                        onChange={(e) => setNombreAseguradora(e.target.value)}
                                        className="flex-1 bg-white/50 dark:bg-slate-800/50 px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary font-bold text-slate-800 dark:text-white"
                                        autoFocus
                                    />
                                    <button type="submit" className="bg-primary text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-900 transition-all">
                                        Confirmar
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {loading ? (
                                <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-[0.3em] flex flex-col items-center">
                                    <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
                                    Cargando...
                                </div>
                            ) : aseguradoras.length === 0 ? (
                                <div className="col-span-full py-20 glass-card rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 font-bold">No hay aseguradoras registradas</div>
                            ) : (
                                aseguradoras.map(asig => (
                                    <button
                                        key={asig.id}
                                        onClick={() => handleSelectAseguradora(asig)}
                                        className="glass-card p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:border-secondary/50 dark:hover:border-secondary/50 hover:shadow-xl transition-all group text-left relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-10 -mt-10 blur-xl group-hover:bg-secondary/10 transition-colors"></div>
                                        <div className="bg-primary/5 dark:bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-primary dark:text-white group-hover:bg-primary group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-primary transition-colors mb-6 shadow-inner">
                                            {asig.nombre[0]}
                                        </div>
                                        <h3 className="text-2xl font-display font-bold tracking-tight mb-2 uppercase text-slate-800 dark:text-white">{asig.nombre}</h3>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center">
                                            Ver Detalles <ChevronRight className="inline w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW 2: INSURER DASHBOARD */}
                {view === 'DASHBOARD' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Removed Year Selector as per request */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleSelectCategory(cat)}
                                    className="glass-card p-10 rounded-[40px] border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-2xl hover:border-secondary/50 transition-all group flex flex-col items-center text-center relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 pointer-events-none"></div>
                                    <div className="bg-primary/5 dark:bg-white/5 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-secondary group-hover:text-primary transition-all text-primary dark:text-white shadow-inner">
                                        <FileText className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-display font-bold tracking-tight mb-2 uppercase text-slate-800 dark:text-white">{cat}</h3>
                                    <div className="mt-6 flex items-center gap-2 font-bold text-primary dark:text-secondary uppercase tracking-widest text-[10px]">
                                        Consultar Registros <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW 4: SETTLEMENT RESULTS */}
                {isSettlementView && (
                    <div className="pb-20">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setIsSettlementView(false)}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                </button>
                                <div>
                                    <h2 className="text-3xl font-display font-bold text-primary dark:text-white tracking-tight uppercase">Liquidación de Comisiones</h2>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                        Periodo: {formatDate(settlementRange.start)} - {formatDate(settlementRange.end)}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleExportSettlement}
                                className="bg-primary text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                            >
                                <Download className="w-4 h-4" /> Descargar Excel
                            </button>
                        </div>

                        <div className="glass-card rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden mb-20">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse" id="settlement-table">
                                    <thead>
                                        <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                            {[
                                                'Mes Liq.', 'Cliente', 'Situación', 'Pago', 'Póliza', 'Fecha Efecto',
                                                'Pago Asegurador', 'Producto', 'Prima Neta', 'Prima Total',
                                                '% Comis.', 'Neto Comis.', 'Comp. Prima', 'Liquidación', 'Comp. Datos'
                                            ].map(h => (
                                                <th key={h} className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {settlementResults.map((reg, idx) => (
                                            <tr key={idx} className="hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-[9px] uppercase">{reg.settlementLabel}</td>
                                                <td className="px-4 py-3 font-bold text-[10px] whitespace-nowrap text-slate-800 dark:text-slate-200">{reg.cliente}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn("w-1.5 h-1.5 rounded-full ring-1 ring-white/20 shadow-sm",
                                                            reg.situacion?.trim().toUpperCase() === 'ALTA' ? 'bg-green-500' : 'bg-red-500'
                                                        )}></span>
                                                        <span className={cn("text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                                            reg.situacion?.trim().toUpperCase() === 'ALTA'
                                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                        )}>
                                                            {reg.situacion}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3"><span className="text-[8px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-500">{reg.tipo_pago}</span></td>
                                                <td className="px-4 py-3 font-mono text-[9px] text-slate-600 dark:text-slate-400 whitespace-nowrap">{reg.numero_poliza}</td>
                                                <td className="px-4 py-3 text-[9px] text-slate-500 dark:text-slate-400 font-bold">{formatDate(reg.fecha_efecto)}</td>
                                                <td className="px-4 py-3 font-bold text-primary dark:text-slate-200 text-[10px]">{Number(reg.pago_hiscox ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3 text-[9px] font-bold whitespace-nowrap text-slate-600 dark:text-slate-400">{reg.producto}</td>
                                                <td className="px-4 py-3 font-bold text-[10px] text-slate-700 dark:text-slate-300">{Number(reg.prima_neta ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3 font-bold text-[10px] text-slate-700 dark:text-slate-300">{Number(reg.prima_total ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3 font-bold text-primary dark:text-secondary text-[10px]">{Number(reg.porcentaje_comision ?? 0).toFixed(2)}%</td>
                                                <td className="px-4 py-3 font-bold text-primary dark:text-slate-200 text-[10px]">{Number(reg.neto_comision ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3 font-bold text-slate-400 text-[10px]">{Number(reg.comprobacion_prima ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3">
                                                    <div className="bg-secondary/20 text-yellow-900 dark:text-yellow-100 font-bold text-[10px] px-2 py-1 rounded-lg border border-secondary/40 inline-block">
                                                        {Number(reg.importe_liquidar ?? 0).toFixed(2)}€
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-slate-400 text-[10px]">{Number(reg.comprobacion_datos ?? 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50/80 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700">
                                        <tr className="font-bold text-primary dark:text-white uppercase tracking-widest text-[9px]">
                                            <td colSpan={8} className="px-4 py-6 text-right">Totales</td>
                                            <td className="px-4 py-6 text-[11px]">{settlementResults.reduce((acc, curr) => acc + Number(curr.prima_neta || 0), 0).toFixed(2)}€</td>
                                            <td className="px-4 py-6 text-[11px]">{settlementResults.reduce((acc, curr) => acc + Number(curr.prima_total || 0), 0).toFixed(2)}€</td>
                                            <td></td>
                                            <td className="px-4 py-6 text-[11px]">{settlementResults.reduce((acc, curr) => acc + Number(curr.neto_comision || 0), 0).toFixed(2)}€</td>
                                            <td></td>
                                            <td className="px-4 py-6 text-[11px]">
                                                <div className="bg-secondary text-primary px-3 py-1.5 rounded-lg shadow-sm">
                                                    {settlementResults.reduce((acc, curr) => acc + Number(curr.importe_liquidar || 0), 0).toFixed(2)}€
                                                </div>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 3: DETAILED TABLE */}
                {view === 'DETAILS' && !isSettlementView && (
                    <div className="pb-20 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-6">
                                <h2 className="text-3xl font-display font-bold text-primary dark:text-white tracking-tighter uppercase">{selectedCategory}</h2>
                                {/* Removed Year Badge */}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsAddingNew(true);
                                        setEditingData({});
                                    }}
                                    className="bg-primary text-secondary px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Nuevo Registro
                                </button>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn("p-3 rounded-xl border shadow-sm transition-all",
                                        showFilters
                                            ? 'bg-primary text-secondary border-primary'
                                            : 'glass-card hover:bg-white/50 dark:hover:bg-slate-800/50'
                                    )}
                                >
                                    <Filter className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleExportData}
                                    className="p-3 glass-card rounded-xl shadow-sm hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all text-primary dark:text-white"
                                    title="Descargar Excel"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {isAddingNew && (
                            <div className="glass-card p-8 rounded-[32px] border border-secondary/50 mb-8 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-xl -mr-10 -mt-10"></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-display font-bold text-primary dark:text-white uppercase tracking-tight">Nuevo Registro</h3>
                                    <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <FormFields data={editingData || {}} onChange={setEditingData} />
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handleAddNew}
                                        className="bg-primary text-white hover:bg-indigo-900 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:shadow-xl transition-all"
                                    >
                                        <Save className="w-4 h-4" /> Guardar Nuevo Registro
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="glass-card rounded-[32px] shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden mb-20">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                            <th className="w-8"></th>
                                            {[
                                                'Cliente', 'Situación', 'Pago', 'Póliza', 'Fecha Efecto',
                                                'Pago Asegurador', 'Producto', 'Prima Neta', 'Prima Total',
                                                '% Comis.', 'Neto Comis.', 'Comp. Prima', 'Liquidación', 'Comp. Datos'
                                            ].map(h => (
                                                <th key={h} className="px-4 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                                            ))}
                                            <th className="px-4 py-4"></th>
                                        </tr>
                                        {showFilters && (
                                            <tr className="bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                                <th className="w-8"></th>
                                                <th className="p-2"><input placeholder="Filtrar..." className="w-full text-[9px] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-secondary" value={filters.cliente || ''} onChange={e => setFilters({ ...filters, cliente: e.target.value })} /></th>
                                                <th className="p-2"><input placeholder="Filtrar..." className="w-full text-[9px] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-secondary" value={filters.situacion || ''} onChange={e => setFilters({ ...filters, situacion: e.target.value })} /></th>
                                                <th className="p-2"><input placeholder="Filtrar..." className="w-full text-[9px] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-secondary" value={filters.tipo_pago || ''} onChange={e => setFilters({ ...filters, tipo_pago: e.target.value })} /></th>
                                                <th className="p-2"><input placeholder="Filtrar..." className="w-full text-[9px] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-secondary" value={filters.numero_poliza || ''} onChange={e => setFilters({ ...filters, numero_poliza: e.target.value })} /></th>
                                                <th className="p-2"><input placeholder="Filtrar..." className="w-full text-[9px] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-secondary" value={filters.fecha_efecto || ''} onChange={e => setFilters({ ...filters, fecha_efecto: e.target.value })} /></th>
                                                <th className="p-2"><input placeholder="Filtrar..." className="w-full text-[9px] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-secondary" value={filters.pago_hiscox || ''} onChange={e => setFilters({ ...filters, pago_hiscox: e.target.value })} /></th>
                                                <th className="p-2"><input placeholder="Filtrar..." className="w-full text-[9px] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-secondary" value={filters.producto || ''} onChange={e => setFilters({ ...filters, producto: e.target.value })} /></th>
                                                <th colSpan={7}></th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredRegistros.length === 0 && !isAddingNew ? (
                                            <tr>
                                                <td colSpan={16} className="px-4 py-16 text-center text-slate-400 font-bold text-[10px] uppercase tracking-wider">No hay registros encontrados.</td>
                                            </tr>
                                        ) : (
                                            filteredRegistros.map((reg) => (
                                                <React.Fragment key={reg.id}>
                                                    <tr
                                                        onClick={() => {
                                                            if (expandedRow === reg.id) {
                                                                setExpandedRow(null);
                                                                setEditingData(null);
                                                            } else {
                                                                setExpandedRow(reg.id);
                                                                setEditingData(reg);
                                                            }
                                                        }}
                                                        className={cn("hover:bg-white/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer text-slate-800 dark:text-slate-200", expandedRow === reg.id && 'bg-primary/5 dark:bg-primary/20')}
                                                    >
                                                        <td className="pl-4 py-4 text-slate-400">
                                                            {expandedRow === reg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        </td>
                                                        <td className="px-4 py-4 font-bold text-[10px] whitespace-nowrap">{reg.cliente}</td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn("w-1.5 h-1.5 rounded-full ring-1 ring-white/20 shadow-sm",
                                                                    reg.situacion?.toUpperCase().trim() === 'ALTA' ? 'bg-green-500' :
                                                                        reg.situacion?.toUpperCase().trim() === 'BAJA' ? 'bg-red-500' : 'bg-slate-300'
                                                                )}></span>
                                                                <span className={cn("text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                                                    reg.situacion?.toUpperCase().trim() === 'ALTA' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                                                        reg.situacion?.toUpperCase().trim() === 'BAJA' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-slate-200 text-slate-500'
                                                                )}>
                                                                    {reg.situacion}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4"><span className="text-[8px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-500 dark:text-slate-400">{reg.tipo_pago}</span></td>
                                                        <td className="px-4 py-4 font-mono text-[9px] whitespace-nowrap text-slate-600 dark:text-slate-400">{reg.numero_poliza}</td>
                                                        <td className="px-4 py-4 text-[9px] text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">{formatDate(reg.fecha_efecto)}</td>
                                                        <td className="px-4 py-4 font-bold text-slate-900 dark:text-slate-100 text-[10px]">{Number(reg.pago_hiscox ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4 text-[9px] font-bold whitespace-nowrap text-slate-600 dark:text-slate-400">{reg.producto}</td>
                                                        <td className="px-4 py-4 font-bold text-[10px] text-slate-700 dark:text-slate-300">{Number(reg.prima_neta ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4 font-bold text-[10px] text-slate-700 dark:text-slate-300">{Number(reg.prima_total ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4 font-bold text-primary dark:text-secondary text-[10px]">{Number(reg.porcentaje_comision ?? 0).toFixed(2)}%</td>
                                                        <td className="px-4 py-4 font-bold text-primary dark:text-white text-[10px]">{Number(reg.neto_comision ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4 font-bold text-[10px] text-slate-400">{Number(reg.comprobacion_prima ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4">
                                                            <div className="bg-secondary/20 text-yellow-900 dark:text-yellow-100 font-bold text-[10px] px-2 py-1 rounded-lg border border-secondary/40 inline-block whitespace-nowrap">
                                                                {Number(reg.importe_liquidar ?? 0).toFixed(2)}€
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 font-bold text-[10px] text-slate-400">{Number(reg.comprobacion_datos ?? 0).toFixed(2)}</td>
                                                        <td className="px-4 py-4 text-right">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteRow(reg.id);
                                                                }}
                                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandedRow === reg.id && (
                                                        <tr>
                                                            <td colSpan={16} className="px-4 py-2 bg-primary/5 dark:bg-slate-800/50">
                                                                <div className="mb-4 p-2">
                                                                    <FormFields data={editingData} onChange={setEditingData} />
                                                                    <div className="flex justify-end gap-2 mt-4">
                                                                        <button
                                                                            onClick={() => setExpandedRow(null)}
                                                                            className="px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-[9px] text-slate-500 hover:text-primary dark:hover:text-white transition-colors"
                                                                        >
                                                                            Cancelar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSaveRow(reg.id)}
                                                                            className="bg-primary text-secondary px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5 hover:shadow-lg transition-all"
                                                                        >
                                                                            <Save className="w-3 h-3" /> Guardar Cambios
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}


function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    if (!dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

const FormFields = ({ data, onChange }: { data: any, onChange: (newData: any) => void }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Cliente</label>
                <input type="text" value={data.cliente || ''} onChange={(e) => handleChange('cliente', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Situación</label>
                <input type="text" value={data.situacion || ''} onChange={(e) => handleChange('situacion', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" placeholder="ALTA / BAJA" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tipo de Pago</label>
                <input type="text" value={data.tipo_pago || ''} onChange={(e) => handleChange('tipo_pago', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nº Póliza</label>
                <input type="text" value={data.numero_poliza || ''} onChange={(e) => handleChange('numero_poliza', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Fecha Efecto</label>
                <input type="date" value={data.fecha_efecto || ''} onChange={(e) => handleChange('fecha_efecto', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Pago Asegurador</label>
                <input type="number" step="0.01" value={data.pago_hiscox || 0} onChange={(e) => handleChange('pago_hiscox', parseFloat(e.target.value))} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Producto</label>
                <input type="text" value={data.producto || ''} onChange={(e) => handleChange('producto', e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Prima Neta</label>
                <input type="number" step="0.01" value={data.prima_neta || 0} onChange={(e) => handleChange('prima_neta', parseFloat(e.target.value))} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Prima Total</label>
                <input type="number" step="0.01" value={data.prima_total || 0} onChange={(e) => handleChange('prima_total', parseFloat(e.target.value))} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">% Comisión</label>
                <input type="number" step="0.01" value={data.porcentaje_comision || 0} onChange={(e) => handleChange('porcentaje_comision', parseFloat(e.target.value))} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Neto Comisión</label>
                <input type="number" step="0.01" value={data.neto_comision || 0} onChange={(e) => handleChange('neto_comision', parseFloat(e.target.value))} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Comp. Prima (Auto)</label>
                <div className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 dark:text-slate-300">
                    {((Number(data.prima_neta || 0) * (Number(data.porcentaje_comision || 0) / 100)) - Number(data.neto_comision || 0)).toFixed(2)}€
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Liq. Aseguradora</label>
                <input type="number" step="0.01" value={data.importe_liquidar || 0} onChange={(e) => handleChange('importe_liquidar', parseFloat(e.target.value))} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Comp. Datos (Auto)</label>
                <div className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 dark:text-slate-300">
                    {((Number(data.prima_total || 0) - (Number(data.prima_neta || 0) * (Number(data.porcentaje_comision || 0) / 100))) - Number(data.importe_liquidar || 0)).toFixed(2)}€
                </div>
            </div>
        </div>
    );
};
