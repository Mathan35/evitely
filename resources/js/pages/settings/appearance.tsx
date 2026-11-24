import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { StudioCard } from '@/components/studio/studio-surface';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance" />

            <h1 className="sr-only">Appearance</h1>

            <StudioCard className="min-w-0 p-4 sm:p-6">
                <h2 className="font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                    Theme
                </h2>
                <p className="mt-1 text-sm text-pretty text-zinc-500">
                    Choose how the studio looks across light and dark sessions.
                </p>
                <div className="mt-6">
                    <AppearanceTabs />
                </div>
            </StudioCard>
        </>
    );
}
