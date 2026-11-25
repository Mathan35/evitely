import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'invidora_cookie_consent_v1';

export function CookieConsentBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            if (window.localStorage.getItem(STORAGE_KEY)) {
                return;
            }
        } catch {
            // private mode — still show once per session via state only
        }
        setVisible(true);
    }, []);

    function accept(): void {
        try {
            window.localStorage.setItem(STORAGE_KEY, 'accepted');
        } catch {
            // ignore
        }
        setVisible(false);
    }

    if (!visible) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center p-3 sm:p-4">
            <div className="pointer-events-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg shadow-zinc-950/10 backdrop-blur sm:flex-row sm:items-center sm:gap-4">
                <p className="flex-1 text-[13px] leading-relaxed text-zinc-600">
                    We use essential cookies to run the studio and light analytics on public invites.{' '}
                    <Link href="/cookies" className="font-medium text-zinc-900 underline underline-offset-2">
                        Cookie notice
                    </Link>
                </p>
                <Button type="button" className="h-10 shrink-0 rounded-full px-5" onClick={accept}>
                    Got it
                </Button>
            </div>
        </div>
    );
}
