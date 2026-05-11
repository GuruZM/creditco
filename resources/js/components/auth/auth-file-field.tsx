import { cn } from '@/lib/utils';
import { FileUp, X } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';

type Props = {
    label: string;
    name: string;
    accept?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    value?: File | null;
    onChange: (file: File | null) => void;
};

export default function AuthFileField({
    label,
    name,
    accept,
    required,
    hint,
    error,
    value,
    onChange,
}: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handlePick = () => inputRef.current?.click();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.files?.[0] ?? null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onChange(file);
        }
    };

    const clear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-medium tracking-wide text-white/70 uppercase">
                {label}
                {required && <span className="ml-1 text-white/40">*</span>}
            </label>

            <div
                role="button"
                tabIndex={0}
                onClick={handlePick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePick();
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={cn(
                    'group relative flex min-h-[64px] cursor-pointer items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 transition',
                    error
                        ? 'border-red-400/40 focus-within:border-red-400/70'
                        : dragActive
                          ? 'border-white/40 bg-white/[0.06]'
                          : 'border-white/10 hover:border-white/30 focus-visible:border-white/40 hover:bg-white/[0.05]',
                )}
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition group-hover:text-white">
                    <FileUp className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    {value ? (
                        <>
                            <p className="truncate text-sm font-medium text-white">
                                {value.name}
                            </p>
                            <p className="text-[11px] text-white/50">
                                {(value.size / 1024).toFixed(0)} KB · click to
                                replace
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-white/85">
                                Click to upload or drag & drop
                            </p>
                            {hint && (
                                <p className="text-[11px] text-white/45">
                                    {hint}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {value && (
                    <button
                        type="button"
                        onClick={clear}
                        aria-label="Remove file"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition hover:bg-white/[0.08] hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    name={name}
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                />
            </div>

            {error && (
                <p className="text-[11px] font-medium text-red-300">{error}</p>
            )}
        </div>
    );
}
