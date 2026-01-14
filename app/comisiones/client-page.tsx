'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, ArrowLeft, Building2, Calendar, ChevronRight, FileText, Download, Filter, Search, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { fetchAseguradoras, fetchRegistros, createAseguradora, createRegistro, editRegistro, removeRegistro } from './actions';

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

    async function handleSelectCategory(cat: string) {
        setSelectedCategory(cat);
        setLoading(true);
        const data = await fetchRegistros(selectedAseguradora.id, selectedYear, cat);
        setRegistros(data);
        setView('DETAILS');
        setLoading(false);
        setExpandedRow(null);
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

    return (
        <main className="min-h-screen bg-[#f8fafb] text-[#16313a] selection:bg-[#ffe008] selection:text-[#16313a]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 py-6 sticky top-0 z-50">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {view !== 'LIST' ? (
                            <button
                                onClick={() => {
                                    if (view === 'DETAILS') setView('DASHBOARD');
                                    else setView('LIST');
                                    setExpandedRow(null);
                                    setIsAddingNew(false);
                                }}
                                className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <Link href="/" className="hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="bg-[#16313a] p-2 rounded-lg shadow-md">
                                <ShieldCheck className="w-5 h-5 text-[#ffe008]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight uppercase">
                                    Aseguradoras
                                </h1>
                                {selectedAseguradora && (
                                    <div className="text-[10px] font-bold text-[#16313a]/40 uppercase tracking-widest mt-0.5">
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
                                className="bg-[#ffe008] text-[#16313a] px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all border border-[#ffe008]"
                            >
                                <Calendar className="w-4 h-4" /> Liquidación Comisiones
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Settlement Selection Modal */}
            {showSettlementModal && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#16313a] rounded-[40px] p-12 max-w-lg w-full text-white shadow-[0_40px_120px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-300 relative border border-white/10">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tight leading-none text-[#ffe008]">Periodo de Liquidación</h2>
                                <p className="text-[11px] font-bold text-[#ffe008]/80 uppercase tracking-[0.2em] mt-3">Define el intervalo de fechas para procesar</p>
                            </div>
                            <button
                                onClick={() => setShowSettlementModal(false)}
                                className="absolute top-10 right-10 text-white/30 hover:text-[#ffe008] hover:rotate-90 transition-all duration-300"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="space-y-8 mb-12">
                            <div className="flex flex-col gap-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-[#ffe008] ml-1">Fecha de Inicio</label>
                                <input
                                    type="date"
                                    value={settlementRange.start}
                                    onChange={(e) => setSettlementRange({ ...settlementRange, start: e.target.value })}
                                    className="bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 font-black text-xl text-white focus:outline-none focus:border-[#ffe008] focus:bg-white/10 transition-all outline-none w-full [color-scheme:dark]"
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-[#ffe008] ml-1">Fecha Finalización</label>
                                <input
                                    type="date"
                                    value={settlementRange.end}
                                    onChange={(e) => setSettlementRange({ ...settlementRange, end: e.target.value })}
                                    className="bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 font-black text-xl text-white focus:outline-none focus:border-[#ffe008] focus:bg-white/10 transition-all outline-none w-full [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateSettlement}
                            className="w-full bg-[#ffe008] text-[#16313a] py-6 rounded-[24px] font-black uppercase tracking-[0.3em] text-sm hover:shadow-[0_20px_50px_rgba(255,224,8,0.3)] hover:scale-[1.02] active:scale-100 transition-all"
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
                            <h2 className="text-3xl font-black tracking-tighter">Aseguradoras</h2>
                            <button
                                onClick={() => setShowNewAseguradora(!showNewAseguradora)}
                                className="bg-[#16313a] text-[#ffe008] px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                            >
                                <Plus className="w-4 h-4" /> Añadir Aseguradora
                            </button>
                        </div>

                        {showNewAseguradora && (
                            <form onSubmit={handleAddAseguradora} className="bg-white p-8 rounded-[40px] border-2 border-[#ffe008] mb-10 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre de la aseguradora..."
                                        value={nombreAseguradora}
                                        onChange={(e) => setNombreAseguradora(e.target.value)}
                                        className="flex-1 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#16313a] font-bold"
                                        autoFocus
                                    />
                                    <button type="submit" className="bg-[#16313a] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">
                                        Confirmar
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {loading ? (
                                <div className="col-span-full py-20 text-center text-[#16313a]/20 font-black uppercase tracking-[0.3em]">Cargando...</div>
                            ) : aseguradoras.length === 0 ? (
                                <div className="col-span-full py-20 bg-white rounded-[40px] border-2 border-dashed text-center text-gray-400 font-bold">No hay aseguradoras registradas</div>
                            ) : (
                                aseguradoras.map(asig => (
                                    <button
                                        key={asig.id}
                                        onClick={() => handleSelectAseguradora(asig)}
                                        className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:border-[#ffe008] hover:shadow-xl transition-all group text-left"
                                    >
                                        <div className="bg-[#16313a]/5 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-[#16313a] group-hover:bg-[#ffe008] transition-colors mb-6">
                                            {asig.nombre[0]}
                                        </div>
                                        <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">{asig.nombre}</h3>
                                        <p className="text-[#16313a]/40 text-sm font-bold uppercase tracking-widest">Ver Detalles <ChevronRight className="inline w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW 2: INSURER DASHBOARD */}
                {view === 'DASHBOARD' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                            <div className="flex items-center gap-4 bg-white p-3 rounded-3xl shadow-sm border border-gray-100">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#16313a]/40 ml-4">Año:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-gray-50 px-4 py-2 rounded-xl border-none font-black text-[#16313a] focus:ring-2 focus:ring-[#ffe008]"
                                >
                                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleSelectCategory(cat)}
                                    className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-[#ffe008] transition-all group flex flex-col items-center text-center"
                                >
                                    <div className="bg-[#16313a]/5 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-[#ffe008] transition-colors">
                                        <FileText className="w-10 h-10 text-[#16313a]" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">{cat}</h3>
                                    <div className="mt-8 flex items-center gap-2 font-black text-[#16313a] uppercase tracking-widest text-[10px]">
                                        Consultar Registros <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
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
                                    className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase">Liquidación de Comisiones</h2>
                                    <div className="text-[10px] font-bold text-[#16313a]/40 uppercase tracking-widest mt-0.5">
                                        Periodo: {formatDate(settlementRange.start)} - {formatDate(settlementRange.end)}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleExportSettlement}
                                className="bg-[#16313a] text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                            >
                                <Download className="w-4 h-4" /> Descargar Excel
                            </button>
                        </div>

                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 mb-20">
                            <div className="rounded-[40px]">
                                <table className="w-full text-left border-collapse" id="settlement-table">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            {[
                                                'Mes Liq.', 'Cliente', 'Situación', 'Pago', 'Póliza', 'Fecha Efecto',
                                                'Pago Hiscox', 'Producto', 'Prima Neta', 'Prima Total',
                                                '% Comis.', 'Neto Comis.', 'Comp. Prima', 'Liquidación', 'Comp. Datos'
                                            ].map(h => (
                                                <th key={h} className="px-4 py-4 text-[8px] font-black uppercase tracking-widest text-[#16313a]/40 whitespace-nowrap bg-gray-50 sticky top-[77px] z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {settlementResults.map((reg, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 font-black text-[#16313a]/40 text-[8px] uppercase">{reg.settlementLabel}</td>
                                                <td className="px-4 py-3 font-bold text-[9px] whitespace-nowrap">{reg.cliente}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ring-1 ring-white shadow-sm ${reg.situacion?.trim().toUpperCase() === 'ALTA' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${reg.situacion?.trim().toUpperCase() === 'ALTA'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-red-50 text-red-600 border border-red-100'
                                                            }`}>
                                                            {reg.situacion}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3"><span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded-md">{reg.tipo_pago}</span></td>
                                                <td className="px-4 py-3 font-mono text-[8px] whitespace-nowrap">{reg.numero_poliza}</td>
                                                <td className="px-4 py-3 text-[8px] text-gray-500 font-bold">{formatDate(reg.fecha_efecto)}</td>
                                                <td className="px-4 py-3 font-bold text-[#16313a] text-[9px]">{Number(reg.pago_hiscox ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3 text-[8px] font-bold whitespace-nowrap">{reg.producto}</td>
                                                <td className="px-4 py-3 font-bold text-[9px]">{Number(reg.prima_neta ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3 font-bold text-[9px]">{Number(reg.prima_total ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3 font-black text-[#16313a] text-[9px]">{Number(reg.porcentaje_comision ?? 0).toFixed(2)}%</td>
                                                <td className="px-4 py-3 font-bold text-[#16313a] text-[9px]">{Number(reg.neto_comision ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3 font-bold text-gray-400 text-[9px]">{Number(reg.comprobacion_prima ?? 0).toFixed(2)}€</td>
                                                <td className="px-4 py-3">
                                                    <div className="bg-[#ffe008]/20 text-[#16313a] font-black text-[9px] px-2 py-1 rounded-lg border border-[#ffe008]/40 inline-block">
                                                        {Number(reg.importe_liquidar ?? 0).toFixed(2)}€
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-gray-400 text-[9px]">{Number(reg.comprobacion_datos ?? 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50/50 border-t-2 border-gray-100">
                                        <tr className="font-black text-[#16313a] uppercase tracking-widest text-[9px]">
                                            <td colSpan={8} className="px-4 py-6 text-right">Totales</td>
                                            <td className="px-4 py-6 text-[10px]">{settlementResults.reduce((acc, curr) => acc + Number(curr.prima_neta || 0), 0).toFixed(2)}€</td>
                                            <td className="px-4 py-6 text-[10px]">{settlementResults.reduce((acc, curr) => acc + Number(curr.prima_total || 0), 0).toFixed(2)}€</td>
                                            <td></td>
                                            <td className="px-4 py-6 text-[10px]">{settlementResults.reduce((acc, curr) => acc + Number(curr.neto_comision || 0), 0).toFixed(2)}€</td>
                                            <td></td>
                                            <td className="px-4 py-6 text-[10px]">
                                                <div className="bg-[#ffe008] px-4 py-2 rounded-xl shadow-sm border border-yellow-200">
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
                    <div className="pb-20">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-6">
                                <div className="bg-[#16313a] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {selectedYear}
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedCategory}</h2>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsAddingNew(true);
                                        setEditingData({});
                                    }}
                                    className="bg-[#16313a] text-[#ffe008] px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Nuevo Registro
                                </button>
                                <button className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-300 transition-all">
                                    <Filter className="w-5 h-5" />
                                </button>
                                <button className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-300 transition-all">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {isAddingNew && (
                            <div className="bg-white p-8 rounded-[40px] border-2 border-[#ffe008] mb-8 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-black uppercase tracking-tight">Nuevo Registro</h3>
                                    <button onClick={() => setIsAddingNew(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <FormFields data={editingData || {}} onChange={setEditingData} />
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handleAddNew}
                                        className="bg-[#16313a] text-[#ffe008] px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:shadow-xl transition-all"
                                    >
                                        <Save className="w-4 h-4" /> Guardar Nuevo Registro
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 mb-20">
                            <div className="rounded-[40px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="w-8 bg-gray-50 sticky top-[77px] z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]"></th>
                                            {[
                                                'Cliente', 'Situación', 'Pago', 'Póliza', 'Fecha Efecto',
                                                'Pago Hiscox', 'Producto', 'Prima Neta', 'Prima Total',
                                                '% Comis.', 'Neto Comis.', 'Comp. Prima', 'Liquidación', 'Comp. Datos'
                                            ].map(h => (
                                                <th key={h} className="px-4 py-4 text-[8px] font-black uppercase tracking-widest text-[#16313a]/40 whitespace-nowrap bg-gray-50 sticky top-[77px] z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]">{h}</th>
                                            ))}
                                            <th className="px-4 py-4 bg-gray-50 sticky top-[77px] z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {registros.length === 0 && !isAddingNew ? (
                                            <tr>
                                                <td colSpan={16} className="px-4 py-16 text-center text-gray-400 font-bold text-[9px]">No hay registros para este año y categoría.</td>
                                            </tr>
                                        ) : (
                                            registros.map((reg) => (
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
                                                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedRow === reg.id ? 'bg-gray-50/80 shadow-inner' : ''}`}
                                                    >
                                                        <td className="pl-4 py-4 text-gray-300">
                                                            {expandedRow === reg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        </td>
                                                        <td className="px-4 py-4 font-bold text-[9px] whitespace-nowrap">{reg.cliente}</td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`w-1.5 h-1.5 rounded-full ring-1 ring-white shadow-sm ${reg.situacion?.toUpperCase().trim() === 'ALTA' ? 'bg-[#00c853]' :
                                                                    reg.situacion?.toUpperCase().trim() === 'BAJA' ? 'bg-[#ff3b30]' : 'bg-gray-300'
                                                                    }`}></span>
                                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm transition-colors ${reg.situacion?.toUpperCase().trim() === 'ALTA' ? 'bg-green-500 text-white' :
                                                                    reg.situacion?.toUpperCase().trim() === 'BAJA' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-400 text-white'
                                                                    }`}>
                                                                    {reg.situacion}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4"><span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded-md">{reg.tipo_pago}</span></td>
                                                        <td className="px-4 py-4 font-mono text-[8px] whitespace-nowrap">{reg.numero_poliza}</td>
                                                        <td className="px-4 py-4 text-[8px] text-gray-500 font-bold whitespace-nowrap">{formatDate(reg.fecha_efecto)}</td>
                                                        <td className="px-4 py-4 font-bold text-[#16313a] text-[9px]">{Number(reg.pago_hiscox ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4 text-[8px] font-bold whitespace-nowrap">{reg.producto}</td>
                                                        <td className="px-4 py-4 font-bold text-[9px]">{Number(reg.prima_neta ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4 font-bold text-[9px]">{Number(reg.prima_total ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4 font-black text-[#16313a] text-[9px]">{Number(reg.porcentaje_comision ?? 0).toFixed(2)}%</td>
                                                        <td className="px-4 py-4 font-bold text-[#16313a] text-[9px]">{Number(reg.neto_comision ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4 font-bold text-[9px] text-gray-400">{Number(reg.comprobacion_prima ?? 0).toFixed(2)}€</td>
                                                        <td className="px-4 py-4">
                                                            <div className="bg-[#ffe008]/20 text-[#16313a] font-black text-[9px] px-2 py-1 rounded-lg border border-[#ffe008]/40 inline-block whitespace-nowrap">
                                                                {Number(reg.importe_liquidar ?? 0).toFixed(2)}€
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 font-bold text-[9px] text-gray-400">{Number(reg.comprobacion_datos ?? 0).toFixed(2)}</td>
                                                        <td className="px-4 py-4 text-right">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteRow(reg.id);
                                                                }}
                                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandedRow === reg.id && (
                                                        <tr>
                                                            <td colSpan={16} className="px-4 py-2 bg-gray-50/50">
                                                                <div className="mb-4">
                                                                    <FormFields data={editingData} onChange={setEditingData} />
                                                                    <div className="flex justify-end gap-2 mt-4">
                                                                        <button
                                                                            onClick={() => setExpandedRow(null)}
                                                                            className="px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] text-gray-400 hover:text-[#16313a] transition-colors"
                                                                        >
                                                                            Cancelar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSaveRow(reg.id)}
                                                                            className="bg-[#16313a] text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] flex items-center gap-1.5 hover:shadow-lg transition-all"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Cliente</label>
                <input type="text" value={data.cliente || ''} onChange={(e) => handleChange('cliente', e.target.value)} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Situación</label>
                <input type="text" value={data.situacion || ''} onChange={(e) => handleChange('situacion', e.target.value)} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" placeholder="ALTA / BAJA" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Tipo de Pago</label>
                <input type="text" value={data.tipo_pago || ''} onChange={(e) => handleChange('tipo_pago', e.target.value)} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Nº Póliza</label>
                <input type="text" value={data.numero_poliza || ''} onChange={(e) => handleChange('numero_poliza', e.target.value)} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Fecha Efecto</label>
                <input type="date" value={data.fecha_efecto || ''} onChange={(e) => handleChange('fecha_efecto', e.target.value)} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Pago Hiscox</label>
                <input type="number" step="0.01" value={data.pago_hiscox || 0} onChange={(e) => handleChange('pago_hiscox', parseFloat(e.target.value))} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Producto</label>
                <input type="text" value={data.producto || ''} onChange={(e) => handleChange('producto', e.target.value)} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Prima Neta</label>
                <input type="number" step="0.01" value={data.prima_neta || 0} onChange={(e) => handleChange('prima_neta', parseFloat(e.target.value))} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Prima Total</label>
                <input type="number" step="0.01" value={data.prima_total || 0} onChange={(e) => handleChange('prima_total', parseFloat(e.target.value))} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">% Comisión</label>
                <input type="number" step="0.01" value={data.porcentaje_comision || 0} onChange={(e) => handleChange('porcentaje_comision', parseFloat(e.target.value))} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Neto Comisión</label>
                <input type="number" step="0.01" value={data.neto_comision || 0} onChange={(e) => handleChange('neto_comision', parseFloat(e.target.value))} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Comp. Prima (Auto)</label>
                <div className="bg-gray-100 border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold text-gray-500">
                    {((Number(data.prima_neta || 0) * (Number(data.porcentaje_comision || 0) / 100)) - Number(data.neto_comision || 0)).toFixed(2)}€
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Liq. Hiscox</label>
                <input type="number" step="0.01" value={data.importe_liquidar || 0} onChange={(e) => handleChange('importe_liquidar', parseFloat(e.target.value))} className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold focus:ring-2 focus:ring-[#ffe008] outline-none" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Comp. Datos (Auto)</label>
                <div className="bg-gray-100 border border-gray-100 rounded-lg px-3 py-1.5 text-[9px] font-bold text-gray-500">
                    {((Number(data.prima_total || 0) - (Number(data.prima_neta || 0) * (Number(data.porcentaje_comision || 0) / 100))) - Number(data.importe_liquidar || 0)).toFixed(2)}€
                </div>
            </div>
        </div>
    );
};

import React from 'react';
