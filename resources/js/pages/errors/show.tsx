import { Head, Link } from '@inertiajs/react';
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
        title: 'Briefly away',
        body: 'The studio is restarting. Come back shortly.',
    },
};

export default function ErrorPage({ status }: { status: number }) {
    const message = messages[status] ?? messages[500];

    return (
        <>
            <Head title={message.title} />
            <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                <p className="text-xs tracking-[0.22em] uppercase">{status}</p>
                <h1 className="mt-3 font-serif text-5xl">{message.title}</h1>
                <p className="mt-4 max-w-md leading-7">{message.body}</p>
                <Link href="/" className="mt-8 underline">
                    Return home
                </Link>
            </main>
        </>
    );
}
