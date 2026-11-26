import { Head, useForm, usePage } from '@inertiajs/react';
import { Bug, CircleHelp, CreditCard, Lightbulb, MessageSquareHeart, Send } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import InputError from '@/components/input-error';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingSeoHead, type MarketingSeoPayload } from '@/components/marketing/marketing-seo-head';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type TopicKey = 'bug' | 'help' | 'billing' | 'feedback' | 'feature' | 'other';

const topicIcons: Record<TopicKey, ReactNode> = {
    bug: <Bug className="size-4" aria-hidden />,
    help: <CircleHelp className="size-4" aria-hidden />,
    billing: <CreditCard className="size-4" aria-hidden />,
    feedback: <MessageSquareHeart className="size-4" aria-hidden />,
    feature: <Lightbulb className="size-4" aria-hidden />,
    other: <Send className="size-4" aria-hidden />,
};

export default function Support({
    topics,
    prefill,
    faqs,
    seo,
}: {
    topics: Record<TopicKey, string>;
    prefill: { name: string; email: string };
    faqs: Array<{ q: string; a: string }>;
    seo?: MarketingSeoPayload;
}) {
    const flash = (
        usePage().props as { flash?: { support_sent?: boolean; toast?: { message?: string } } }
    ).flash;
    const [sent, setSent] = useState(Boolean(flash?.support_sent));
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const form = useForm({
        name: prefill.name ?? '',
        email: prefill.email ?? '',
        topic: 'help' as TopicKey,
        message: '',
        page_url: typeof window !== 'undefined' ? document.referrer || '' : '',
        company: '',
    });

    useEffect(() => {
        if (flash?.support_sent) {
            setSent(true);
        }
    }, [flash?.support_sent]);

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post('/support', {
            preserveScroll: true,
            onSuccess: () => {
                setSent(true);
                form.reset('message', 'page_url', 'company');
            },
        });
    }

    return (
        <>
            {seo ? (
                <MarketingSeoHead seo={seo} />
            ) : (
                <Head title="Support" />
            )}

            <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,_#f7f3ec_0%,_#f3f0ea_42%,_#ebe7e0_100%)] text-zinc-950 dark:bg-[radial-gradient(ellipse_at_top,_#161513_0%,_#0c0b0a_55%,_#090908_100%)] dark:text-zinc-50">
                <MarketingHeader back={{ href: '/', label: 'Back to home' }} />

                <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-14">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                            Support
                        </p>
                        <h1 className="mt-3 font-serif text-4xl tracking-tight text-zinc-950 sm:text-5xl dark:text-white">
                            We’re here to help
                        </h1>
                        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
                            Report a bug, ask a question, or share an idea. Tell us what you need —
                            we usually reply within one business day.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-12">
                        <section className="rounded-[1.75rem] border border-zinc-950/8 bg-white/80 p-5 shadow-[0_20px_60px_-40px_rgba(28,23,18,0.45)] backdrop-blur sm:p-8 dark:border-white/10 dark:bg-zinc-950/60">
                            {sent ? (
                                <div className="flex min-h-[22rem] flex-col items-center justify-center px-4 text-center">
                                    <div className="grid size-14 place-items-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                                        <Send className="size-6" aria-hidden />
                                    </div>
                                    <h2 className="mt-5 font-serif text-3xl tracking-tight">
                                        Message sent
                                    </h2>
                                    <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                        {flash?.toast?.message ??
                                            'Thanks — your message is on its way. We usually reply within one business day.'}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mt-8 rounded-full"
                                        onClick={() => setSent(false)}
                                    >
                                        Send another message
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="relative space-y-6" noValidate>
                                    <div>
                                        <Label className="text-sm font-medium">What is this about?</Label>
                                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {(Object.keys(topics) as TopicKey[]).map((key) => {
                                                const active = form.data.topic === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => form.setData('topic', key)}
                                                        className={cn(
                                                            'inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm transition',
                                                            active
                                                                ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-950'
                                                                : 'border-zinc-950/10 bg-white/70 text-zinc-700 hover:border-zinc-950/20 hover:bg-white dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-900',
                                                        )}
                                                    >
                                                        {topicIcons[key]}
                                                        <span className="leading-tight">{topics[key]}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <InputError message={form.errors.topic} className="mt-2" />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="support-name">Name</Label>
                                            <Input
                                                id="support-name"
                                                value={form.data.name}
                                                onChange={(e) => form.setData('name', e.target.value)}
                                                autoComplete="name"
                                                placeholder="Your name"
                                                className="h-11 rounded-xl bg-white/80 dark:bg-zinc-900/70"
                                            />
                                            <InputError message={form.errors.name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="support-email">Email</Label>
                                            <Input
                                                id="support-email"
                                                type="email"
                                                value={form.data.email}
                                                onChange={(e) => form.setData('email', e.target.value)}
                                                autoComplete="email"
                                                placeholder="you@email.com"
                                                className="h-11 rounded-xl bg-white/80 dark:bg-zinc-900/70"
                                            />
                                            <InputError message={form.errors.email} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="support-message">How can we help?</Label>
                                        <Textarea
                                            id="support-message"
                                            value={form.data.message}
                                            onChange={(e) => form.setData('message', e.target.value)}
                                            rows={6}
                                            placeholder="Describe the issue, question, or idea. Include steps to reproduce if it’s a bug."
                                            className="min-h-36 rounded-xl bg-white/80 dark:bg-zinc-900/70"
                                        />
                                        <InputError message={form.errors.message} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="support-page">
                                            Page URL <span className="font-normal text-zinc-500">(optional)</span>
                                        </Label>
                                        <Input
                                            id="support-page"
                                            value={form.data.page_url}
                                            onChange={(e) => form.setData('page_url', e.target.value)}
                                            placeholder="https://invidora.com/…"
                                            className="h-11 rounded-xl bg-white/80 dark:bg-zinc-900/70"
                                        />
                                        <InputError message={form.errors.page_url} />
                                    </div>

                                    {/* Honeypot */}
                                    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0" aria-hidden>
                                        <Label htmlFor="support-company">Company</Label>
                                        <Input
                                            id="support-company"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={form.data.company}
                                            onChange={(e) => form.setData('company', e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-12 w-full rounded-full text-sm font-semibold sm:w-auto sm:px-8"
                                    >
                                        {form.processing ? 'Sending…' : 'Send message'}
                                    </Button>
                                </form>
                            )}
                        </section>

                        <aside className="space-y-6">
                            <div className="rounded-[1.75rem] border border-zinc-950/8 bg-white/55 p-5 backdrop-blur sm:p-6 dark:border-white/10 dark:bg-zinc-950/45">
                                <h2 className="font-serif text-2xl tracking-tight">Quick answers</h2>
                                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                    Check these first — many hosts find what they need here.
                                </p>
                                <ul className="mt-5 space-y-2">
                                    {faqs.map((faq, index) => {
                                        const open = openFaq === index;
                                        return (
                                            <li
                                                key={faq.q}
                                                className="overflow-hidden rounded-2xl border border-zinc-950/8 bg-white/80 dark:border-white/10 dark:bg-zinc-900/50"
                                            >
                                                <button
                                                    type="button"
                                                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium"
                                                    aria-expanded={open}
                                                    onClick={() => setOpenFaq(open ? null : index)}
                                                >
                                                    <span>{faq.q}</span>
                                                    <span
                                                        className={cn(
                                                            'text-lg leading-none text-zinc-400 transition',
                                                            open && 'rotate-45',
                                                        )}
                                                        aria-hidden
                                                    >
                                                        +
                                                    </span>
                                                </button>
                                                {open ? (
                                                    <p className="border-t border-zinc-950/6 px-4 py-3 text-sm leading-6 text-zinc-600 dark:border-white/8 dark:text-zinc-400">
                                                        {faq.a}
                                                    </p>
                                                ) : null}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            <div className="rounded-[1.75rem] border border-zinc-950/8 bg-zinc-950 px-5 py-6 text-[#f6f1e8] sm:px-6 dark:border-white/10">
                                <p className="text-[11px] font-semibold tracking-[0.18em] text-[#f6f1e8]/55 uppercase">
                                    Response time
                                </p>
                                <p className="mt-3 font-serif text-2xl tracking-tight">
                                    Usually within one business day
                                </p>
                                <p className="mt-3 text-sm leading-6 text-[#f6f1e8]/70">
                                    Urgent publish or payment issues get priority. Include your account email so we can find you faster.
                                </p>
                            </div>
                        </aside>
                    </div>
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
