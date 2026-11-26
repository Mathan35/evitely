import { MessageCircle, Smile, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EmojiPickerBoard, insertAtSelection } from '@/components/studio/emoji-picker';
import { previewShareTemplate } from '@/lib/share-message';
import { cn } from '@/lib/utils';

const PUBLIC_PLACEHOLDERS = ['title', 'date', 'time', 'place', 'url'] as const;
const GUEST_PLACEHOLDERS = ['title', 'date', 'time', 'place', 'guest_name', 'guest_url'] as const;

export type ShareTemplatePreviewVars = {
    title: string;
    date: string;
    time: string;
    place: string;
    url: string;
    guest_name: string;
    guest_url: string;
};

function PlaceholderChips({
    tokens,
    onInsert,
}: {
    tokens: readonly string[];
    onInsert: (token: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {tokens.map((token) => (
                <button
                    key={token}
                    type="button"
                    className="rounded-full border border-zinc-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:border-emerald-300/80 hover:bg-emerald-50/80 hover:text-emerald-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-950/40"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onInsert(`{{${token}}}`)}
                >
                    {`{{${token}}}`}
                </button>
            ))}
        </div>
    );
}

function ChatPreview({
    label,
    text,
    tone = 'guest',
}: {
    label: string;
    text: string;
    tone?: 'public' | 'guest';
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-2xl',
                tone === 'guest'
                    ? 'bg-[#e5ddd5] dark:bg-[#0b141a]'
                    : 'bg-zinc-100 dark:bg-zinc-900/80',
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-2 border-b px-3 py-2',
                    tone === 'guest'
                        ? 'border-black/5 bg-[#075e54] text-white dark:border-white/10 dark:bg-[#1f2c34]'
                        : 'border-zinc-200/80 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200',
                )}
            >
                <MessageCircle className="size-3.5 opacity-80" />
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase opacity-90">{label}</p>
            </div>
            <div className="space-y-2 p-3 sm:p-3.5">
                <div
                    className={cn(
                        'ml-auto max-w-[92%] rounded-2xl rounded-tr-md px-3 py-2 text-[13px] leading-relaxed shadow-sm',
                        tone === 'guest'
                            ? 'bg-[#dcf8c6] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]'
                            : 'bg-white text-zinc-800 ring-1 ring-zinc-950/6 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10',
                    )}
                >
                    <pre className="whitespace-pre-wrap font-sans">{text || '…'}</pre>
                    <p
                        className={cn(
                            'mt-1 text-right text-[10px] tabular-nums',
                            tone === 'guest' ? 'text-[#667781] dark:text-white/45' : 'text-zinc-400',
                        )}
                    >
                        Preview
                    </p>
                </div>
            </div>
        </div>
    );
}

function MessageComposer({
    label,
    hint,
    value,
    placeholder,
    tokens,
    previewLabel,
    previewText,
    previewTone,
    rows = 5,
    onChange,
}: {
    label: string;
    hint: string;
    value: string;
    placeholder: string;
    tokens: readonly string[];
    previewLabel: string;
    previewText: string;
    previewTone: 'public' | 'guest';
    rows?: number;
    onChange: (value: string) => void;
}) {
    const fieldRef = useRef<HTMLTextAreaElement | null>(null);
    const selectionRef = useRef({ start: value.length, end: value.length });
    const [emojiOpen, setEmojiOpen] = useState(false);

    useEffect(() => {
        selectionRef.current = {
            start: Math.min(selectionRef.current.start, value.length),
            end: Math.min(selectionRef.current.end, value.length),
        };
    }, [value.length]);

    function rememberSelection(target?: HTMLTextAreaElement | null): void {
        const el = target ?? fieldRef.current;
        if (!el) {
            return;
        }
        selectionRef.current = {
            start: el.selectionStart ?? selectionRef.current.start,
            end: el.selectionEnd ?? selectionRef.current.end,
        };
    }

    function insertToken(token: string): void {
        const el = fieldRef.current;
        const start =
            el && document.activeElement === el
                ? (el.selectionStart ?? selectionRef.current.start)
                : selectionRef.current.start;
        const end =
            el && document.activeElement === el
                ? (el.selectionEnd ?? selectionRef.current.end)
                : selectionRef.current.end;
        const next = insertAtSelection(value, token, start, end);
        onChange(next.value.slice(0, 800));
        selectionRef.current = { start: next.caret, end: next.caret };
        window.requestAnimationFrame(() => {
            const field = fieldRef.current;
            if (!field) {
                return;
            }
            field.focus();
            field.setSelectionRange(next.caret, next.caret);
            rememberSelection(field);
        });
    }

    function insertEmoji(emoji: string): void {
        insertToken(emoji);
    }

    return (
        <div className="min-w-0 overflow-hidden rounded-[1.35rem] border border-zinc-200/90 bg-white shadow-[0_12px_40px_-28px_rgba(24,24,27,0.45)] dark:border-white/10 dark:bg-zinc-950/60 dark:shadow-none">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-white/10">
                <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold tracking-tight text-zinc-950 dark:text-white">
                        {label}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">{hint}</p>
                </div>
                <button
                    type="button"
                    title="Emojis"
                    aria-expanded={emojiOpen}
                    aria-label={emojiOpen ? 'Close emoji picker' : 'Open emoji picker'}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setEmojiOpen((open) => !open)}
                    className={cn(
                        'emoji-picker-trigger inline-flex size-9 shrink-0 items-center justify-center rounded-full transition',
                        emojiOpen
                            ? 'is-open bg-[#075e54] text-white shadow-sm'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
                    )}
                >
                    {emojiOpen ? <X className="size-3.5" /> : <Smile className="size-3.5" />}
                </button>
            </div>

            <div className="space-y-3 p-4">
                <PlaceholderChips tokens={tokens} onInsert={insertToken} />

                <div className="relative">
                    <textarea
                        ref={fieldRef}
                        value={value}
                        maxLength={800}
                        rows={rows}
                        placeholder={placeholder}
                        onSelect={(event) => rememberSelection(event.currentTarget)}
                        onKeyUp={(event) => rememberSelection(event.currentTarget)}
                        onClick={(event) => rememberSelection(event.currentTarget)}
                        onBlur={(event) => rememberSelection(event.currentTarget)}
                        onChange={(event) => {
                            rememberSelection(event.currentTarget);
                            onChange(event.target.value.slice(0, 800));
                        }}
                        className={cn(
                            'min-h-[7.5rem] w-full resize-y rounded-2xl border-0 bg-[#f7f8f9] px-3.5 py-3 text-[14px] leading-relaxed text-zinc-900 shadow-none outline-none ring-1 ring-zinc-950/8 transition',
                            'placeholder:text-zinc-400 focus:bg-white focus:ring-emerald-600/25',
                            'dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10 dark:focus:bg-zinc-950 dark:focus:ring-emerald-400/30',
                        )}
                    />
                    <p className="pointer-events-none absolute right-3 bottom-2.5 text-[10px] font-medium tabular-nums text-zinc-400">
                        {value.length}/800
                    </p>
                </div>

                {emojiOpen ? (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <EmojiPickerBoard onPick={insertEmoji} />
                    </div>
                ) : null}

                <ChatPreview label={previewLabel} text={previewText} tone={previewTone} />
            </div>
        </div>
    );
}

/**
 * Customize WhatsApp/SMS/public share body text (not OG link preview).
 * Use mode to show public, guest, or both — e.g. billing auto-share uses guest only.
 */
export function ShareMessageTemplatesPanel({
    mode = 'both',
    publicTemplate,
    guestTemplate,
    defaultPublicTemplate,
    defaultGuestTemplate,
    previewVars,
    onPublicTemplate,
    onGuestTemplate,
    guestLabel = 'Personal guest invite',
    guestHint = 'WhatsApp / SMS to each guest',
    className,
    compact = false,
}: {
    mode?: 'both' | 'public' | 'guest';
    publicTemplate: string;
    guestTemplate: string;
    defaultPublicTemplate: string;
    defaultGuestTemplate: string;
    previewVars: ShareTemplatePreviewVars;
    onPublicTemplate?: (value: string) => void;
    onGuestTemplate?: (value: string) => void;
    guestLabel?: string;
    guestHint?: string;
    className?: string;
    compact?: boolean;
}) {
    const showPublic = mode === 'both' || mode === 'public';
    const showGuest = mode === 'both' || mode === 'guest';
    const publicDraft = publicTemplate.trim() || defaultPublicTemplate;
    const guestDraft = guestTemplate.trim() || defaultGuestTemplate;
    const publicPreview = previewShareTemplate(publicDraft, previewVars, 'url');
    const guestPreview = previewShareTemplate(guestDraft, previewVars, 'guest_url');
    const both = showPublic && showGuest;

    return (
        <div className={cn('min-w-0 space-y-4', className)}>
            {!compact ? (
                <p className="text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Leave a template blank to use the occasion default. Place the cursor, then insert placeholders or
                    WhatsApp-style emojis. The invite URL is added automatically if you omit{' '}
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">{'{{url}}'}</span> or{' '}
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">{'{{guest_url}}'}</span>.
                </p>
            ) : (
                <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Text guests see in WhatsApp/SMS — not only the link. Tap ☺ to add emojis at the cursor.
                </p>
            )}

            <div
                className={cn(
                    'grid min-w-0 gap-4',
                    both && !compact ? 'lg:grid-cols-2' : 'grid-cols-1',
                )}
            >
                {showPublic && onPublicTemplate ? (
                    <MessageComposer
                        label="Public share message"
                        hint={`${publicTemplate.length}/800 · site share buttons`}
                        value={publicTemplate}
                        placeholder={defaultPublicTemplate}
                        tokens={PUBLIC_PLACEHOLDERS}
                        previewLabel="Public share preview"
                        previewText={publicPreview}
                        previewTone="public"
                        rows={compact ? 4 : 5}
                        onChange={onPublicTemplate}
                    />
                ) : null}

                {showGuest && onGuestTemplate ? (
                    <MessageComposer
                        label={guestLabel}
                        hint={`${guestTemplate.length}/800 · ${guestHint}`}
                        value={guestTemplate}
                        placeholder={defaultGuestTemplate}
                        tokens={GUEST_PLACEHOLDERS}
                        previewLabel="WhatsApp-style preview"
                        previewText={guestPreview}
                        previewTone="guest"
                        rows={compact ? 4 : 5}
                        onChange={onGuestTemplate}
                    />
                ) : null}
            </div>
        </div>
    );
}
