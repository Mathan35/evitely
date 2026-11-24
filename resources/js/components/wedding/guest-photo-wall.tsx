import { useForm } from '@inertiajs/react';
import { ImagePlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { inviteActionPath } from '@/lib/invite-actions';
import { cn } from '@/lib/utils';

type GuestPhoto = {
    id: number;
    name: string;
    caption: string | null;
    photo_url: string | null;
};

/** Public guest photo wall — approved grid + optional upload when enabled. */
export function GuestPhotoWall({
    slug,
    inviteRootDomain,
    photos = [],
    enabled = false,
    guestName = '',
    className,
}: {
    slug: string;
    inviteRootDomain?: string | null;
    photos?: GuestPhoto[];
    enabled?: boolean;
    guestName?: string | null;
    className?: string;
}) {
    const approved = photos.filter((photo) => photo.photo_url);
    const [open, setOpen] = useState(false);
    const form = useForm<{ name: string; caption: string; photo: File | null }>({
        name: guestName || '',
        caption: '',
        photo: null,
    });

    if (!enabled && approved.length === 0) {
        return null;
    }

    function submit(event: FormEvent): void {
        event.preventDefault();
        if (!form.data.photo || !slug) {
            return;
        }
        form.post(inviteActionPath({ slug, invite_root_domain: inviteRootDomain }, 'guest-photos'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset('caption', 'photo');
            },
        });
    }

    return (
        <section
            id="guest-photos"
            className={cn('mx-auto max-w-4xl px-5 py-14', className)}
            data-preview-reveal
        >
            <p className="text-center text-[10px] tracking-[0.28em] text-[var(--w-accent,#9a7b3c)] uppercase">
                Moments
            </p>
            <h2 className="mt-3 text-center font-serif text-3xl font-light tracking-tight text-[var(--w-ink,#18181b)] sm:text-4xl">
                Photo wall
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-[var(--w-muted,#71717a)]">
                Share a favorite moment — hosts approve before photos appear here.
            </p>

            {approved.length > 0 ? (
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {approved.map((photo) => (
                        <figure key={photo.id} className="overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-950/5">
                            <img
                                src={photo.photo_url || ''}
                                alt={photo.caption || photo.name}
                                className="aspect-square w-full object-cover"
                            />
                            <figcaption className="px-3 py-2.5">
                                <p className="truncate text-[13px] font-semibold text-zinc-900">{photo.name}</p>
                                {photo.caption ? (
                                    <p className="mt-0.5 line-clamp-2 text-[12px] text-zinc-500">{photo.caption}</p>
                                ) : null}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            ) : (
                <p className="mt-8 text-center text-sm text-zinc-500">No photos yet — be the first to share.</p>
            )}

            {enabled && slug ? (
                <div className="mt-8 flex justify-center">
                    {!open ? (
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--w-accent,#18181b)] px-5 text-sm font-semibold text-white"
                        >
                            <ImagePlus className="size-4" />
                            Add a photo
                        </button>
                    ) : (
                        <form
                            onSubmit={submit}
                            className="w-full max-w-md space-y-3 rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-zinc-950/5"
                        >
                            <input
                                required
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                placeholder="Your name"
                                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                            />
                            <textarea
                                value={form.data.caption}
                                onChange={(event) => form.setData('caption', event.target.value)}
                                placeholder="Caption (optional)"
                                rows={2}
                                className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
                            />
                            <input
                                required
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) =>
                                    form.setData('photo', event.target.files?.[0] ?? null)
                                }
                                className="block w-full text-sm"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={form.processing || !form.data.photo}
                                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {form.processing ? 'Uploading…' : 'Submit photo'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-zinc-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            ) : null}
        </section>
    );
}
