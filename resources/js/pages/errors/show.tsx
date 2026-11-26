import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

const messages: Record<number, { title: string; body: string }> = {
    403: {
        title: 'This page is private',
        body: 'You can only open weddings that belong to you.',
    },
    404: {
        title: 'This invitation is not here',
        body: 'The link may be unfinished, or the address has changed.',
    },
    419: {
        title: 'The page expired',
        body: 'Refresh and try that again.',
    },
    500: {
        title: 'Something went wrong',
        body: 'The invitation is safe. Try again in a moment.',
    },
    503: {
        title: 'We’re updating things',
        body: 'A quick refresh is in progress. This page will reload automatically — usually in under a minute.',
    },
};

export default function ErrorPage({ status }: { status: number }) {
    const message = messages[status] ?? messages[500];
    const isUpdating = status === 503;
    const [seconds, setSeconds] = useState(12);

    useEffect(() => {
        if (!isUpdating) {
            return;
        }

        const tick = window.setInterval(() => {
            setSeconds((prev) => (prev <= 1 ? 12 : prev - 1));
        }, 1000);

        const reload = window.setTimeout(() => {
            window.location.reload();
        }, 12_000);

        return () => {
            window.clearInterval(tick);
            window.clearTimeout(reload);
        };
    }, [isUpdating]);

    return (
        <>
            <Head title={message.title}>
                {isUpdating ? <meta httpEquiv="refresh" content="12" /> : null}
            </Head>
            <main className="relative flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_#f7f3ec_0%,_#ebe4da_55%,_#e3ddd4_100%)] px-6 text-center text-zinc-950 dark:bg-[radial-gradient(ellipse_at_top,_#161412_0%,_#0c0b0a_60%,_#090908_100%)] dark:text-zinc-50">
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <span className="size-2.5 animate-pulse rounded-full bg-[#c6a36a] shadow-[0_0_0_4px_rgba(198,163,106,0.22)]" />
                    Invidora
                </div>
                {!isUpdating ? (
                    <p className="mt-6 text-xs tracking-[0.22em] text-zinc-500 uppercase">{status}</p>
                ) : null}
                <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">{message.title}</h1>
                <p className="mt-4 max-w-md text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
                    {message.body}
                </p>
                {isUpdating ? (
                    <>
                        <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-[#c6a36a]/20">
                            <div className="h-full w-2/5 animate-[slide_1.4s_ease-in-out_infinite] rounded-full bg-[#c6a36a]" />
                        </div>
                        <p className="mt-4 text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
                            Refreshing in {seconds}s
                        </p>
                        <style>{`@keyframes slide{0%{transform:translateX(-30%)}100%{transform:translateX(180%)}}`}</style>
                    </>
                ) : (
                    <Link href="/" className="mt-8 underline underline-offset-4">
                        Return home
                    </Link>
                )}
            </main>
        </>
    );
}