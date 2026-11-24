import { useEffect, type PropsWithChildren } from 'react';
import { clearStaleDocumentScrollLocks } from '@/lib/document-scroll-lock';

/** Bare shell for /admin/login — no studio chrome, no festive loaders. */
export default function AdminAuthLayout({ children }: PropsWithChildren) {
    useEffect(() => {
        clearStaleDocumentScrollLocks();
        document.documentElement.classList.remove('boot-skeleton-active', 'festive-loader-active');
    }, []);

    return <>{children}</>;
}
