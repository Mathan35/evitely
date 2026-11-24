import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'danger',
    loading = false,
    onConfirm,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'default';
    loading?: boolean;
    onConfirm: () => void;
    children?: ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children}
            <DialogContent className="gap-5 rounded-[1.35rem] border-zinc-200/80 p-6 shadow-2xl shadow-zinc-950/15 sm:max-w-md">
                <DialogHeader className="gap-2 text-left">
                    <DialogTitle className="text-[17px] font-semibold tracking-tight text-zinc-900">{title}</DialogTitle>
                    {description ? (
                        <DialogDescription className="text-[13px] leading-relaxed text-zinc-500">
                            {description}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="h-10 rounded-full px-5" disabled={loading}>
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        disabled={loading}
                        className={cn(
                            'h-10 rounded-full px-5',
                            tone === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
                        )}
                        variant={tone === 'danger' ? 'default' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        {loading ? 'Working…' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
