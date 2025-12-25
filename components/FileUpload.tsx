'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    slots: number;
    onFilesSelected: (files: (File | null)[]) => void;
}

export function FileUpload({ slots, onFilesSelected }: FileUploadProps) {
    const [files, setFiles] = useState<(File | null)[]>([]);

    useEffect(() => {
        setFiles(new Array(slots).fill(null));
    }, [slots]);

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0] || null;

        if (file && file.size > MAX_FILE_SIZE) {
            alert(`El archivo "${file.name}" es demasiado grande (Máx 50MB).`);
            return;
        }

        const newFiles = [...files];
        newFiles[index] = file;
        setFiles(newFiles);
        onFilesSelected(newFiles);
    };

    const clearFile = (index: number) => {
        const newFiles = [...files];
        newFiles[index] = null;
        setFiles(newFiles);
        onFilesSelected(newFiles);
    };

    return (
        <div className="my-10 max-w-5xl mx-auto px-4">
            <div className={cn(
                "grid gap-6",
                slots === 1 ? "grid-cols-1 max-w-sm mx-auto" :
                    slots === 2 ? "grid-cols-1 sm:grid-cols-2" :
                        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            )}>
                {new Array(slots).fill(0).map((_, i) => (
                    <UploadSlot
                        key={i}
                        file={files[i]}
                        label={`Propuesta ${i + 1}`}
                        onChange={(e) => handleFileChange(e, i)}
                        onClear={() => clearFile(i)}
                    />
                ))}
            </div>
        </div>
    );
}

function UploadSlot({
    file,
    label,
    onChange,
    onClear
}: {
    file: File | null,
    label: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onClear: () => void
}) {
    return (
        <div className={cn(
            "group relative border-2 border-dashed rounded-[1.5rem] p-6 flex flex-col items-center justify-center transition-all duration-300 min-h-[140px]",
            file
                ? "border-slate-900 bg-slate-50 shadow-md"
                : "border-slate-200 bg-white hover:border-yellow-400 hover:bg-yellow-50/30"
        )}>
            {file ? (
                <div className="text-center w-full">
                    <div className="bg-slate-900 text-yellow-400 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] font-black text-slate-900 truncate max-w-[120px] mx-auto mb-1 uppercase tracking-tighter">
                        {file.name}
                    </p>
                    <button
                        onClick={onClear}
                        className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors absolute -top-2 -right-2 shadow-lg border-2 border-white"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center py-4">
                    <div className="bg-slate-100 text-slate-400 w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:bg-yellow-400 group-hover:text-slate-900 shadow-inner">
                        <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-[12px] font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-[0.2em]">{label}</span>
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={onChange}
                    />
                </label>
            )}
        </div>
    );
}
