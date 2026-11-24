import { useCallback, useState } from 'react';

type ConfirmOptions = {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'default';
};

type PendingConfirm = ConfirmOptions & {
    resolve: (confirmed: boolean) => void;
};

export function useConfirmDialog() {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setPending({ ...options, resolve });
        });
    }, []);

    const close = useCallback(
        (confirmed: boolean) => {
            pending?.resolve(confirmed);
            setPending(null);
        },
        [pending],
    );

    return {
        confirm,
        dialogProps: {
            open: pending != null,
            onOpenChange: (open: boolean) => {
                if (!open) {
                    close(false);
                }
            },
            title: pending?.title ?? '',
            description: pending?.description,
            confirmLabel: pending?.confirmLabel ?? 'Confirm',
            cancelLabel: pending?.cancelLabel ?? 'Cancel',
            tone: pending?.tone ?? 'danger',
            onConfirm: () => close(true),
        },
    };
}
