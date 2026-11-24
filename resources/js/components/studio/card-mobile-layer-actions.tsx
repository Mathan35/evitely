import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Compact mobile selection tooltip — Edit / Delete only.
 * Keeps pointer events on the buttons so drag on the layer stays free.
 */
export function CardMobileLayerActions({
    onEdit,
    onDelete,
    className,
}: {
    onEdit: () => void;
    onDelete: () => void;
    className?: string;
}) {
    return (
        <div
            data-mobile-layer-actions
            className={cn(
                'pointer-events-auto inline-flex items-center gap-0.5 rounded-full border border-zinc-200/90 bg-white/95 p-1',
                'shadow-[0_10px_28px_-12px_rgba(24,24,27,0.55)] backdrop-blur-xl',
                className,
            )}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                aria-label="Edit"
                title="Edit"
                onClick={onEdit}
                className="grid size-9 place-items-center rounded-full text-zinc-700 transition active:scale-95 hover:bg-zinc-100"
            >
                <Pencil className="size-4" />
            </button>
            <span className="h-5 w-px bg-zinc-200" aria-hidden />
            <button
                type="button"
                aria-label="Delete"
                title="Delete"
                onClick={onDelete}
                className="grid size-9 place-items-center rounded-full text-rose-600 transition active:scale-95 hover:bg-rose-50"
            >
                <Trash2 className="size-4" />
            </button>
        </div>
    );
}
