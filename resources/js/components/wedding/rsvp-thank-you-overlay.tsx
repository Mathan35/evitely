import { usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type ThankYouFlash = {
    guest_name?: string;
    status?: string;
    title?: string;
    message?: string;
};

/** Named RSVP confirmation overlay — premium close after guest replies. */
export function RsvpThankYouOverlay() {
    const page = usePage<{ flash?: { rsvp_thank_you?: ThankYouFlash | null } }>();
    const payload = page.props.flash?.rsvp_thank_you ?? null;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (payload?.message || payload?.guest_name) {
            setOpen(true);
        }
    }, [payload]);

    if (!open || !payload) {
        return null;
    }

    const name = payload.guest_name?.trim() || 'Guest';
    const status = (payload.status || '').replace(/_/g, ' ');

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/45 p-4 backdrop-blur-[2px] sm:items-center">
            <div
                role="dialog"
                aria-modal
                aria-labelledby="rsvp-thank-you-title"
                className="w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-4 rounded-[1.5rem] border border-white/20 bg-white p-6 shadow-2xl duration-300"
            >
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Check className="size-5" />
                </div>
                <h2
                    id="rsvp-thank-you-title"
                    className="mt-4 text-center font-serif text-2xl tracking-tight text-zinc-950"
                >
                    Thank you, {name}
                </h2>
                <p className="mt-2 text-center text-[14px] leading-relaxed text-zinc-600">
                    {payload.message ||
                        `We've saved your reply${status ? ` as “${status}”` : ''}${
                            payload.title ? ` for ${payload.title}` : ''
                        }.`}
                </p>
                <Button
                    type="button"
                    className="mt-5 h-11 w-full rounded-full"
                    onClick={() => setOpen(false)}
                >
                    Continue reading the invite
                </Button>
            </div>
        </div>
    );
}
