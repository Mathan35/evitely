import { createContext, useContext, type ReactNode } from 'react';

type PreviewInteractions = {
    /** When false, RSVP CTAs are inert (template editor). Other actions still work. */
    allowRsvp: boolean;
};

const PreviewInteractionsContext = createContext<PreviewInteractions>({ allowRsvp: true });

export function PreviewInteractionsProvider({
    allowRsvp,
    children,
}: {
    allowRsvp: boolean;
    children: ReactNode;
}) {
    return (
        <PreviewInteractionsContext.Provider value={{ allowRsvp }}>
            {children}
        </PreviewInteractionsContext.Provider>
    );
}

export function useAllowRsvp(): boolean {
    return useContext(PreviewInteractionsContext).allowRsvp;
}
