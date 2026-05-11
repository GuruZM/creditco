import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { ComponentProps } from 'react';

type Option = { value: string; label: string };

type Props = Omit<ComponentProps<'select'>, 'children'> & {
    label: string;
    options: Option[];
    placeholder?: string;
    error?: string;
};

export default function AuthSelect({
    label,
    options,
    placeholder = 'Select...',
    error,
    className,
    id,
    ...rest
}: Props) {
    const selectId = id ?? rest.name ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1.5">
            <label
                htmlFor={selectId}
                className="text-[11px] font-medium tracking-wide text-white/70 uppercase"
            >
                {label}
                {rest.required && (
                    <span className="ml-1 text-white/40">*</span>
                )}
            </label>

            <div
                className={cn(
                    'group relative flex items-center rounded-xl border bg-white/[0.03] transition',
                    error
                        ? 'border-red-400/40 focus-within:border-red-400/70'
                        : 'border-white/10 focus-within:border-white/40 focus-within:bg-white/[0.06]',
                )}
            >
                <select
                    id={selectId}
                    {...rest}
                    className={cn(
                        'h-11 w-full appearance-none bg-transparent px-3 pr-9 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50',
                        '[&>option]:bg-black [&>option]:text-white',
                        className,
                    )}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-white/40" />
            </div>

            {error && (
                <p className="text-[11px] font-medium text-red-300">{error}</p>
            )}
        </div>
    );
}
