import { Link } from '@inertiajs/react';
import { ExternalLink, Redo2, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EditorTopBar({
    projectName,
    savedAt,
    centerNote,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onPublish,
    onSave,
    onPreview,
    onBack,
    publishing = false,
    saving = false,
    publishLabel = 'Publish',
    saveLabel = 'Save',
    previewHref,
    eventsHref = '/events',
    eventsLabel = '← Events',
    className,
}: {
    projectName: string;
    savedAt?: string | null;
    /** Centered product notice (e.g. draft hint) — replaces the project pill when set. */
    centerNote?: string | null;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onPublish: () => void;
    /** Optional explicit Save (site editor). When omitted, only Publish is shown. */
    onSave?: () => void;
    onPreview?: () => void;
    /** When set, back is a button (e.g. dirty confirm) instead of a plain Link. */
    onBack?: () => void;
    publishing?: boolean;
    saving?: boolean;
    publishLabel?: string;
    saveLabel?: string;
    previewHref: string;
    eventsHref?: string;
    eventsLabel?: string;
    className?: string;
}) {
    const backClassName =
        'inline-flex h-8 shrink-0 items-center rounded-full px-2 text-[12px] font-medium text-zinc-500 transition hover:bg-white/70 hover:text-zinc-900 hover:shadow-sm sm:h-9 sm:px-3 sm:text-[13px]';

    return (
        <header
            className={cn(
                'relative z-20 flex h-12 w-full min-w-0 max-w-full shrink-0 items-center gap-1.5 overflow-hidden px-2 sm:h-14 sm:gap-3 sm:px-5',
                className,
            )}
        >
            {onBack ? (
                <button type="button" onClick={onBack} className={backClassName}>
                    {eventsLabel}
                </button>
            ) : (
                <Link href={eventsHref} className={backClassName}>
                    {eventsLabel}
                </Link>
            )}

            <div className="flex min-w-0 flex-1 items-center justify-center">
                {centerNote ? (
                    <p className="max-w-[min(100%,28rem)] truncate text-center text-[12px] font-medium tracking-tight text-zinc-600 sm:text-[13px]">
                        {centerNote}
                    </p>
                ) : (
                    <div className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 shadow-sm ring-1 ring-zinc-950/5 backdrop-blur sm:gap-2 sm:px-3.5 sm:py-1.5">
                        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
                        <p className="truncate text-[12px] font-semibold tracking-tight text-zinc-900 sm:text-[13px]">{projectName}</p>
                        <span className="hidden truncate text-[11px] text-zinc-400 sm:inline">{savedAt ?? 'Ready'}</span>
                    </div>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                <IconButton label="Undo" onClick={onUndo} disabled={!canUndo}>
                    <Undo2 className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton label="Redo" onClick={onRedo} disabled={!canRedo}>
                    <Redo2 className="h-3.5 w-3.5" />
                </IconButton>
                {onPreview ? (
                    <button
                        type="button"
                        onClick={onPreview}
                        className="ml-0.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/75 px-2.5 text-[12px] font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-950/5 transition hover:text-zinc-900 sm:ml-1 sm:px-3"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                    </button>
                ) : (
                    <Link
                        href={previewHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-0.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/75 px-2.5 text-[12px] font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-950/5 transition hover:text-zinc-900 sm:ml-1 sm:px-3"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                    </Link>
                )}
                {onSave ? (
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="ml-0.5 inline-flex h-9 items-center rounded-full bg-white/75 px-3 text-[12px] font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-950/5 transition hover:text-zinc-900 disabled:opacity-50 sm:ml-1 sm:px-4"
                    >
                        {saving ? 'Saving…' : saveLabel}
                    </button>
                ) : null}
                <button
                    type="button"
                    onClick={onPublish}
                    disabled={publishing}
                    className={cn(
                        'ml-0.5 inline-flex h-9 items-center rounded-full px-3 text-[12px] font-semibold transition active:scale-[0.98] disabled:opacity-50 sm:ml-1 sm:px-4',
                        publishLabel === 'View site'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-500'
                            : 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 hover:bg-zinc-800',
                    )}
                >
                    {publishLabel}
                </button>
            </div>
        </header>
    );
}

function IconButton({
    label,
    children,
    onClick,
    disabled,
}: {
    label: string;
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className="grid size-8 place-items-center rounded-full text-zinc-500 transition hover:bg-white/80 hover:text-zinc-900 hover:shadow-sm disabled:opacity-30 sm:size-9"
        >
            {children}
        </button>
    );
}
