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
        <div className="my-10 max-w-6xl mx-auto px-4">
            <div className={cn(
                "grid gap-8",
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
            "group relative border-2 border-dashed rounded-[25px] p-8 flex flex-col items-center justify-center transition-all duration-500 min-h-[160px]",
            file
                ? "border-xeoris-blue bg-white shadow-2xl scale-[1.02]"
                : "border-gray-100 bg-gray-50/50 hover:border-xeoris-yellow hover:bg-white hover:shadow-lg"
        )}>
            {file ? (
                <div className="text-center w-full">
                    <div className="bg-xeoris-blue text-xeoris-yellow w-12 h-12 rounded-[15px] flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3">
                        <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-[11px] font-black text-xeoris-blue truncate max-w-[140px] mx-auto mb-1 uppercase tracking-tighter">
                        {file.name}
                    </p>
                    <button
                        onClick={onClear}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-black transition-all absolute -top-3 -right-3 shadow-xl border-4 border-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center py-6">
                    <div className="bg-white text-gray-200 w-12 h-12 rounded-[15px] flex items-center justify-center mb-4 transition-all group-hover:bg-xeoris-yellow group-hover:text-xeoris-blue shadow-sm border border-gray-50">
                        <Upload className="w-6 h-6 outline-none" />
                    </div>
                    <span className="text-[12px] font-black text-gray-300 group-hover:text-xeoris-blue transition-colors uppercase tracking-[0.3em] font-serif italic">{label}</span>
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
