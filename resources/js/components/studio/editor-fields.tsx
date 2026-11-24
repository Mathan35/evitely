import { forwardRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const controlClass = cn(
    'h-11 w-full rounded-2xl border-0 bg-zinc-100/90 px-3.5 text-[13px] text-zinc-900 shadow-none',
    'ring-1 ring-zinc-950/5 transition-all duration-200',
    'placeholder:text-zinc-400',
    'hover:bg-zinc-100 hover:ring-zinc-950/10',
    'focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-zinc-900/15 focus-visible:outline-none',
);

const areaClass = cn(
    'min-h-28 w-full rounded-2xl border-0 bg-zinc-100/90 px-3.5 py-3 text-[13px] text-zinc-900 shadow-none',
    'ring-1 ring-zinc-950/5 transition-all duration-200',
    'placeholder:text-zinc-400',
    'hover:bg-zinc-100 hover:ring-zinc-950/10',
    'focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-zinc-900/15 focus-visible:outline-none',
);

export function EditorField({
    label,
    hint,
    children,
    className,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('grid gap-2', className)}>
            <div className="flex items-end justify-between gap-3 px-0.5">
                <Label className="text-[11px] font-semibold tracking-[0.08em] text-zinc-500 uppercase">{label}</Label>
                {hint ? <span className="text-[11px] text-zinc-400">{hint}</span> : null}
            </div>
            {children}
        </div>
    );
}

export const EditorTextInput = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>(
    function EditorTextInput({ className, onChange, ...props }, ref) {
        return (
            <Input
                ref={ref}
                className={cn(controlClass, 'active:scale-[0.995]', className)}
                onChange={onChange}
                {...props}
            />
        );
    },
);

export const EditorTextArea = forwardRef<HTMLTextAreaElement, ComponentProps<typeof Textarea>>(
    function EditorTextArea({ className, ...props }, ref) {
        return <Textarea ref={ref} className={cn(areaClass, className)} {...props} />;
    },
);

export function EditorSelect({
    value,
    onValueChange,
    placeholder,
    options,
    className,
    contentClassName,
    triggerStyle,
}: {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options: { value: string; label: string; hint?: string; previewStyle?: CSSProperties }[];
    className?: string;
    contentClassName?: string;
    triggerStyle?: CSSProperties;
}) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger
                style={triggerStyle}
                className={cn(
                    'h-11 !w-full min-w-0 rounded-2xl border-0 bg-zinc-100/90 px-3.5 text-[13px] shadow-none',
                    'ring-1 ring-zinc-950/5 transition-all duration-200',
                    'hover:bg-zinc-100 hover:ring-zinc-950/10',
                    'focus:ring-2 focus:ring-zinc-900/15 data-[state=open]:bg-white data-[state=open]:ring-2 data-[state=open]:ring-zinc-900/15',
                    '*:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate',
                    className,
                )}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent
                className={cn(
                    'z-[80] max-h-72 rounded-2xl border-zinc-200/80 shadow-xl shadow-zinc-950/10',
                    contentClassName,
                )}
            >
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        className="rounded-xl py-2.5 text-[13px]"
                        style={option.previewStyle}
                    >
                        {option.hint ? `${option.label} · ${option.hint}` : option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function EditorCheckbox({
    checked,
    onCheckedChange,
    label,
    description,
    className,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: string;
    description?: string;
    className?: string;
}) {
    return (
        <label
            className={cn(
                'group flex cursor-pointer items-start gap-3 rounded-2xl bg-zinc-100/70 px-3.5 py-3.5',
                'ring-1 ring-zinc-950/5 transition-all duration-200',
                'hover:bg-white hover:ring-zinc-950/10 hover:shadow-sm',
                'has-[[data-state=checked]]:bg-white has-[[data-state=checked]]:ring-zinc-900/15 has-[[data-state=checked]]:shadow-sm',
                className,
            )}
        >
            <Checkbox
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
                className="mt-0.5 size-5 rounded-md border-zinc-300 transition data-[state=checked]:border-zinc-900 data-[state=checked]:bg-zinc-900"
            />
            <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-zinc-900">{label}</span>
                {description ? (
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">{description}</span>
                ) : null}
            </span>
        </label>
    );
}

export function EditorNotice({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'rounded-2xl bg-gradient-to-br from-zinc-100/90 via-white to-zinc-50 px-4 py-3.5 text-[12px] leading-relaxed text-zinc-600',
                'ring-1 ring-zinc-950/5 shadow-sm shadow-zinc-950/5',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function EditorPanelMotion({ children, panelKey }: { children: ReactNode; panelKey: string }) {
    return (
        <div
            key={panelKey}
            className="animate-in fade-in slide-in-from-right-2 fill-mode-both duration-300 ease-out"
        >
            {children}
        </div>
    );
}
