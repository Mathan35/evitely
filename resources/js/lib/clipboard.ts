/**
 * Copy text in HTTPS and local http://*.test contexts, including inside Radix dialogs.
 * Dialog focus traps break naive textarea+execCommand — use a copy-event interceptor first.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    const value = text ?? '';

    if (!value) {
        return false;
    }

    // Prefer the async API only in secure contexts (HTTPS / localhost).
    if (
        typeof window !== 'undefined' &&
        window.isSecureContext &&
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText
    ) {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch {
            // Fall through — permissions or transient failures.
        }
    }

    if (typeof document === 'undefined') {
        return false;
    }

    // Works even when focus is trapped in a modal: inject clipboard data on the copy event.
    let intercepted = false;
    const onCopy = (event: ClipboardEvent): void => {
        event.clipboardData?.setData('text/plain', value);
        event.preventDefault();
        intercepted = true;
    };

    document.addEventListener('copy', onCopy, true);
    try {
        if (document.execCommand('copy') && intercepted) {
            return true;
        }
    } catch {
        // Fall through to textarea path.
    } finally {
        document.removeEventListener('copy', onCopy, true);
    }

    // Last resort: temporary field inside the open dialog (or body) so focus trap allows select.
    const host =
        document.querySelector<HTMLElement>('[data-slot="dialog-content"][data-state="open"]') ||
        document.querySelector<HTMLElement>('[role="dialog"][data-state="open"]') ||
        document.body;

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.tabIndex = -1;
    textarea.style.cssText =
        'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;margin:0;border:0;opacity:0;z-index:2147483647;';

    const blockFocusTrap = (event: FocusEvent): void => {
        if (event.target === textarea) {
            event.stopImmediatePropagation();
        }
    };
    document.addEventListener('focusin', blockFocusTrap, true);

    host.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, value.length);

    intercepted = false;
    let ok = false;
    try {
        document.addEventListener('copy', onCopy, true);
        ok = document.execCommand('copy') || intercepted;
    } catch {
        ok = false;
    } finally {
        document.removeEventListener('copy', onCopy, true);
        document.removeEventListener('focusin', blockFocusTrap, true);
        textarea.remove();
    }

    return ok || intercepted;
}
