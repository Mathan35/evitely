import { useEffect } from 'react';
import { FestivePageLoader } from '@/components/festive-page-loader';
import { acquireDocumentScrollLock } from '@/lib/document-scroll-lock';
import { cn } from '@/lib/utils';

/** Festive cartoon loader when guests tap Home from another section. */
export function HomeReturnSkeleton({ active }: { active: boolean }) {
    useEffect(() => {
        if (!active) {
            return;
        }

        document.documentElement.classList.add('festive-loader-active');
        const release = acquireDocumentScrollLock();

        return () => {
            document.documentElement.classList.remove('festive-loader-active');
            release();
        };
    }, [active]);

    if (!active) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-[#f8f0e3]',
                'animate-in fade-in duration-200',
            )}
            role="status"
            aria-live="polite"
            aria-label="Loading home"
            data-home-return-skeleton=""
        >
            <FestivePageLoader kind="public-site" />
            <span className="sr-only">Returning home</span>
        </div>
    );
}
