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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
        const file = e.target.files?.[0] || null;
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
        <div className="grid md:grid-cols-2 gap-8 my-8">
            {/* Slot 1 */}
            <UploadSlot
                file={file1}
                label="Subir PDF 1"
                onChange={(e) => handleFileChange(e, 1)}
                onClear={() => clearFile(1)}
            />

            {/* Slot 2 */}
            <UploadSlot
                file={file2}
                label="Subir PDF 2"
                onChange={(e) => handleFileChange(e, 2)}
                onClear={() => clearFile(2)}
            />
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
            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors min-h-[200px]",
            file ? "border-xeoris-blue bg-blue-50/50" : "border-gray-200 hover:border-xeoris-yellow"
        )}>
            {file ? (
                <div className="text-center w-full">
                    <div className="bg-xeoris-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-xeoris-blue" />
                    </div>
                    <p className="font-medium text-xeoris-blue truncate max-w-[200px] mx-auto mb-2">
                        {file.name}
                    </p>
                    <button
                        onClick={onClear}
                        className="text-sm text-red-500 hover:text-red-700 flex items-center justify-center gap-1 mx-auto"
                    >
                        <X className="w-4 h-4" /> Eliminar
                    </button>
                </div>
            ) : (
                <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors group-hover:bg-xeoris-yellow/20">
                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-xeoris-blue" />
                    </div>
                    <span className="text-lg font-medium text-gray-600 mb-1">{label}</span>
                    <span className="text-sm text-gray-400">PDF (Max 10MB)</span>
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
