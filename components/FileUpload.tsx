'use client';

import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFilesSelected: (file1: File | null, file2: File | null) => void;
}

export function FileUpload({ onFilesSelected }: FileUploadProps) {
    const [file1, setFile1] = useState<File | null>(null);
    const [file2, setFile2] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
        const file = e.target.files?.[0] || null;

        if (file && file.size > MAX_FILE_SIZE) {
            setError(`El archivo "${file.name}" es demasiado grande. El límite es de 50MB.`);
            return;
        }

        setError(null);
        if (slot === 1) {
            setFile1(file);
        } else {
            setFile2(file);
        }
        // Propagate changes
        onFilesSelected(slot === 1 ? file : file1, slot === 2 ? file : file2);
    };

    const clearFile = (slot: 1 | 2) => {
        if (slot === 1) {
            setFile1(null);
        } else {
            setFile2(null);
        }
        onFilesSelected(slot === 1 ? null : file1, slot === 2 ? null : file2);
    };

    return (
        <div className="my-6 max-w-2xl mx-auto">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm border border-red-100 animate-in fade-in slide-in-from-top-2 text-center">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                {/* Slot 1 */}
                <UploadSlot
                    file={file1}
                    label="Póliza 1"
                    onChange={(e) => handleFileChange(e, 1)}
                    onClear={() => clearFile(1)}
                />

                {/* Slot 2 */}
                <UploadSlot
                    file={file2}
                    label="Póliza 2"
                    onChange={(e) => handleFileChange(e, 2)}
                    onClear={() => clearFile(2)}
                />
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
            "group relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-300 min-h-[140px]",
            file
                ? "border-xeoris-blue bg-xeoris-yellow/5"
                : "border-gray-200 hover:border-xeoris-yellow hover:bg-xeoris-yellow/5"
        )}>
            {file ? (
                <div className="text-center w-full">
                    <div className="bg-xeoris-blue text-xeoris-yellow w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                        <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-xeoris-blue truncate max-w-[120px] mx-auto mb-2 uppercase tracking-tight">
                        {file.name}
                    </p>
                    <button
                        onClick={onClear}
                        className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors absolute -top-2 -right-2 shadow-sm"
                        title="Eliminar archivo"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                    <div className="bg-xeoris-yellow text-xeoris-blue w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110 shadow-sm">
                        <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-xeoris-blue mb-0.5 uppercase tracking-wide">{label}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Click para subir</span>
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
