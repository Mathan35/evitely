import { useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';

/** Flash a short-lived “copied” key after a successful clipboard write. */
export function useFlashCopy(durationMs = 1600) {
    const [copied, setCopied] = useState<string | null>(null);

    function flash(key: string): void {
        setCopied(key);
        window.setTimeout(() => {
            setCopied((current) => (current === key ? null : current));
        }, durationMs);
    }

    async function copyText(key: string, value: string): Promise<boolean> {
        const ok = await copyToClipboard(value);
        if (ok) {
            flash(key);
        }
        return ok;
    }

    return { copied, flash, copyText };
}
