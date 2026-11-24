import { createContext, useContext, type ReactNode } from 'react';
import type { PreviewLocaleOption } from '@/components/marketing/site-previews/preview-locale-switch';

export type PreviewLocaleContextValue = {
    locales: PreviewLocaleOption[];
    active: string;
    onChange: (code: string) => void;
};

const PreviewLocaleContext = createContext<PreviewLocaleContextValue | null>(null);

export function PreviewLocaleProvider({
    locales,
    active,
    onChange,
    children,
}: {
    locales: PreviewLocaleOption[];
    active: string;
    onChange: (code: string) => void;
    children: ReactNode;
}) {
    if (locales.length < 2) {
        return children;
    }

    return (
        <PreviewLocaleContext.Provider value={{ locales, active, onChange }}>
            {children}
        </PreviewLocaleContext.Provider>
    );
}

export function usePreviewLocale(): PreviewLocaleContextValue | null {
    return useContext(PreviewLocaleContext);
}
