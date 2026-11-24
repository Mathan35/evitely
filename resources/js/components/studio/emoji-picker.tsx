import { Search, Smile, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    WHATSAPP_EMOJI_CATEGORIES,
    type EmojiCategoryId,
} from '@/lib/whatsapp-emojis';
import { cn } from '@/lib/utils';

type EmojiPickerBoardProps = {
    onPick: (emoji: string) => void;
    className?: string;
};

/** WhatsApp-style emoji board (categories + search) with open / grid animations. */
export function EmojiPickerBoard({ onPick, className }: EmojiPickerBoardProps) {
    const [categoryId, setCategoryId] = useState<EmojiCategoryId>('smileys');
    const [query, setQuery] = useState('');
    const [gridKey, setGridKey] = useState(0);
    const [picked, setPicked] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => searchRef.current?.focus(), 40);
        return () => window.clearTimeout(timer);
    }, []);

    const category =
        WHATSAPP_EMOJI_CATEGORIES.find((item) => item.id === categoryId) ?? WHATSAPP_EMOJI_CATEGORIES[0];

    const emojis = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) {
            return category.emojis;
        }
        return WHATSAPP_EMOJI_CATEGORIES.flatMap((item) => item.emojis).filter((emoji, index, all) => {
            if (all.indexOf(emoji) !== index) {
                return false;
            }
            if (/[a-z]/.test(needle)) {
                const hitCategory = WHATSAPP_EMOJI_CATEGORIES.some(
                    (cat) => cat.emojis.includes(emoji) && cat.label.toLowerCase().includes(needle),
                );
                return hitCategory || emoji.includes(needle);
            }
            return emoji.includes(needle);
        });
    }, [category.emojis, query]);

    function selectCategory(id: EmojiCategoryId): void {
        setCategoryId(id);
        setQuery('');
        setGridKey((key) => key + 1);
    }

    function handlePick(emoji: string): void {
        setPicked(emoji);
        onPick(emoji);
        window.setTimeout(() => setPicked((current) => (current === emoji ? null : current)), 320);
    }

    return (
        <div
            className={cn('emoji-picker-board', className)}
            onMouseDown={(event) => event.preventDefault()}
        >
            <div className="emoji-picker-board__glow" aria-hidden />

            <div className="border-b border-zinc-200/80 bg-white px-2.5 py-2">
                <div className="emoji-picker-board__search relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-400" />
                    <input
                        ref={searchRef}
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setGridKey((key) => key + 1);
                        }}
                        placeholder="Search by category…"
                        className="h-9 w-full rounded-full border-0 bg-zinc-100 pr-3 pl-8 text-[12px] text-zinc-800 outline-none ring-1 ring-zinc-950/5 placeholder:text-zinc-400 focus:bg-white focus:ring-zinc-300"
                    />
                </div>
            </div>

            {!query.trim() ? (
                <div className="emoji-picker-board__tabs flex gap-0.5 overflow-x-auto border-b border-zinc-200/80 bg-white px-1.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {WHATSAPP_EMOJI_CATEGORIES.map((item, index) => {
                        const active = item.id === categoryId;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                title={item.label}
                                onClick={() => selectCategory(item.id)}
                                style={{ ['--tab-i' as string]: index }}
                                className={cn('emoji-picker-tab', active && 'is-active')}
                            >
                                <span aria-hidden className="emoji-picker-tab__icon">
                                    {item.icon}
                                </span>
                                <span className="sr-only">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}

            <div className="max-h-52 overflow-y-auto overscroll-contain p-2">
                <p className="emoji-picker-board__label mb-1.5 px-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                    {query.trim() ? 'Search results' : category.label}
                </p>
                {emojis.length === 0 ? (
                    <p className="px-1 py-6 text-center text-[12px] text-zinc-500">No emojis found</p>
                ) : (
                    <div key={gridKey} className="emoji-picker-grid grid grid-cols-8 gap-0.5 sm:grid-cols-9">
                        {emojis.map((emoji, index) => (
                            <button
                                key={`${emoji}-${index}`}
                                type="button"
                                title={emoji}
                                onClick={() => handlePick(emoji)}
                                style={{ ['--emoji-i' as string]: Math.min(index, 40) }}
                                className={cn(
                                    'emoji-picker-cell',
                                    picked === emoji && 'is-picked',
                                )}
                            >
                                <span className="emoji-picker-cell__glyph">{emoji}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

type EmojiPickerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPick: (emoji: string) => void;
    className?: string;
    triggerClassName?: string;
};

/**
 * Toolbar trigger + WhatsApp-style emoji board for studio text fields.
 * Insert at caret in the parent (see ContentTemplatePanel).
 */
export function EmojiPicker({
    open,
    onOpenChange,
    onPick,
    className,
    triggerClassName,
}: EmojiPickerProps) {
    return (
        <div className={cn(className)}>
            <button
                type="button"
                title="Emojis"
                aria-expanded={open}
                aria-label={open ? 'Close emoji picker' : 'Open emoji picker'}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onOpenChange(!open)}
                className={cn(
                    'emoji-picker-trigger inline-flex size-8 items-center justify-center rounded-full transition',
                    open ? 'is-open bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
                    triggerClassName,
                )}
            >
                {open ? <X className="size-3.5" /> : <Smile className="size-3.5" />}
            </button>

            {open ? <EmojiPickerBoard onPick={onPick} className="mt-2" /> : null}
        </div>
    );
}

/** Insert `insert` into `value` at [start, end), returning next value + caret. */
export function insertAtSelection(
    value: string,
    insert: string,
    start: number,
    end: number,
): { value: string; caret: number } {
    const safeStart = Math.max(0, Math.min(start, value.length));
    const safeEnd = Math.max(safeStart, Math.min(end, value.length));
    return {
        value: `${value.slice(0, safeStart)}${insert}${value.slice(safeEnd)}`,
        caret: safeStart + insert.length,
    };
}
