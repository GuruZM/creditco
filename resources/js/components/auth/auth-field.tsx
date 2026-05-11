import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { ComponentProps, useState } from 'react';

type Props = Omit<ComponentProps<'input'>, 'type'> & {
    type?: 'text' | 'email' | 'password';
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    rightSlot?: React.ReactNode;
    error?: string;
};

export default function AuthField({
    label,
    icon: Icon,
    rightSlot,
    error,
    type = 'text',
    className,
    id,
    ...rest
}: Props) {
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (revealed ? 'text' : 'password') : type;

    const inputId = id ?? rest.name ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
                <label
                    htmlFor={inputId}
                    className="text-[11px] font-medium tracking-wide text-white/70 uppercase"
                >
                    {label}
                </label>
                {rightSlot}
            </div>

            <div
                className={cn(
                    'group relative flex items-center rounded-xl border bg-white/[0.03] transition',
                    error
                        ? 'border-red-400/40 focus-within:border-red-400/70'
                        : 'border-white/10 focus-within:border-white/40 focus-within:bg-white/[0.06]',
                )}
            >
                {Icon && (
                    <Icon className="ml-3 h-4 w-4 shrink-0 text-white/40 transition group-focus-within:text-white/80" />
                )}
                <input
                    id={inputId}
                    type={inputType}
                    className={cn(
                        'h-11 w-full bg-transparent px-3 text-sm text-white placeholder:text-white/30 outline-none disabled:cursor-not-allowed disabled:opacity-50',
                        Icon ? 'pl-2' : '',
                        isPassword ? 'pr-10' : '',
                        className,
                    )}
                    {...rest}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed((v) => !v)}
                        tabIndex={-1}
                        aria-label={revealed ? 'Hide password' : 'Show password'}
                        className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                    >
                        {revealed ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>

            {error && (
                <p className="text-[11px] font-medium text-red-300">{error}</p>
            )}
        </div>
    );
}
