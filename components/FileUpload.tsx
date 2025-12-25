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
        <div className="my-8 max-w-4xl mx-auto">
            <div className={cn(
                "grid gap-4",
                slots === 1 ? "grid-cols-1 max-w-sm mx-auto" :
                    slots === 2 ? "grid-cols-2" :
                        "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
            )}>
                {new Array(slots).fill(0).map((_, i) => (
                    <UploadSlot
                        key={i}
                        file={files[i]}
                        label={`Oferta ${i + 1}`}
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
            "group relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-300 min-h-[120px]",
            file
                ? "border-xeoris-yellow bg-xeoris-yellow/5 shadow-[0_0_15px_rgba(255,230,0,0.1)]"
                : "border-gray-700/50 hover:border-xeoris-yellow hover:bg-xeoris-yellow/5"
        )}>
            {file ? (
                <div className="text-center w-full">
                    <div className="bg-xeoris-yellow text-xeoris-blue w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <FileText className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-xeoris-yellow truncate max-w-[90px] mx-auto mb-1 uppercase tracking-tighter">
                        {file.name}
                    </p>
                    <button
                        onClick={onClear}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors absolute -top-2 -right-2 shadow-md"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                    <div className="bg-gray-800 text-xeoris-yellow w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all group-hover:bg-xeoris-yellow group-hover:text-xeoris-blue shadow-inner">
                        <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 group-hover:text-xeoris-yellow transition-colors uppercase tracking-widest">{label}</span>
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
