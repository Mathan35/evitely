import { router, useForm } from '@inertiajs/react';
import { Check, Clock3, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type CollaboratorRow = {
    id: number;
    email: string;
    role: string;
    accepted_at?: string | null;
    is_accepted?: boolean;
};

const ROLE_OPTIONS = [
    {
        value: 'editor',
        label: 'Can edit',
        hint: 'Manage guests, RSVPs, seating, and the editor',
    },
    {
        value: 'viewer',
        label: 'View only',
        hint: 'See lists and analytics — no changes',
    },
] as const;

export function EventCollaborators({
    eventId,
    collaborators = [],
    isOwner = false,
}: {
    eventId: number;
    collaborators?: CollaboratorRow[] | null;
    isOwner?: boolean;
}) {
    const rows = Array.isArray(collaborators) ? collaborators : [];
    const form = useForm({ email: '', role: 'editor' });
    const activeRole = ROLE_OPTIONS.find((option) => option.value === form.data.role) ?? ROLE_OPTIONS[0];

    if (!isOwner) {
        return null;
    }

    return (
        <section className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-zinc-950/[0.06]">
            <div className="border-b border-zinc-100 px-5 py-5 sm:px-6">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">Access</p>
                <h2 className="mt-1 font-serif text-2xl tracking-tight text-zinc-950">Co-hosts</h2>
                <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-zinc-500">
                    Invite a partner or planner by email. They accept the link, then appear below.
                </p>
            </div>

            <form
                className="space-y-4 border-b border-zinc-100 px-5 py-5 sm:px-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(`/events/${eventId}/collaborators`, {
                        preserveScroll: true,
                        onSuccess: () => form.reset('email'),
                    });
                }}
            >
                <label className="block space-y-1.5">
                    <span className="text-[12px] font-medium text-zinc-600">Email</span>
                    <Input
                        type="email"
                        required
                        className="h-11 rounded-xl border-zinc-200 bg-white"
                        placeholder="partner@email.com"
                        value={form.data.email}
                        onChange={(event) => form.setData('email', event.target.value)}
                    />
                </label>

                <div className="space-y-1.5">
                    <span className="text-[12px] font-medium text-zinc-600">Permission</span>
                    <div className="grid grid-cols-2 gap-2">
                        {ROLE_OPTIONS.map((option) => {
                            const selected = form.data.role === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => form.setData('role', option.value)}
                                    className={cn(
                                        'rounded-xl px-3 py-3 text-left transition ring-1',
                                        selected
                                            ? 'bg-zinc-950 text-white ring-zinc-950'
                                            : 'bg-zinc-50 text-zinc-700 ring-zinc-950/8 hover:bg-white hover:ring-zinc-950/15',
                                    )}
                                >
                                    <span className="block text-[13px] font-semibold">{option.label}</span>
                                    <span
                                        className={cn(
                                            'mt-0.5 block text-[11px] leading-snug',
                                            selected ? 'text-white/70' : 'text-zinc-500',
                                        )}
                                    >
                                        {option.hint}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                        {activeRole.label} selected · ownership stays with you
                    </p>
                </div>

                <Button
                    type="submit"
                    disabled={form.processing || !form.data.email.trim()}
                    className="h-11 w-full rounded-full bg-zinc-950 text-white hover:bg-zinc-800 sm:w-auto sm:px-6"
                >
                    <UserPlus className="mr-1.5 size-3.5" />
                    {form.processing ? 'Sending…' : 'Send invite'}
                </Button>
            </form>

            <div className="px-5 py-5 sm:px-6">
                {rows.length > 0 ? (
                    <ul className="divide-y divide-zinc-100">
                        {rows.map((row) => {
                            const accepted = Boolean(row.is_accepted || row.accepted_at);
                            const roleMeta =
                                ROLE_OPTIONS.find((option) => option.value === row.role) ?? ROLE_OPTIONS[0];

                            return (
                                <li
                                    key={row.id}
                                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-[14px] font-medium text-zinc-950">
                                            {row.email}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                            <span className="font-semibold text-zinc-600">{roleMeta.label}</span>
                                            <span className="text-zinc-300">·</span>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 font-semibold',
                                                    accepted ? 'text-emerald-700' : 'text-amber-700',
                                                )}
                                            >
                                                {accepted ? (
                                                    <Check className="size-3" />
                                                ) : (
                                                    <Clock3 className="size-3" />
                                                )}
                                                {accepted ? 'Accepted' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.delete(`/events/${eventId}/collaborators/${row.id}`, {
                                                preserveScroll: true,
                                            })
                                        }
                                        className="shrink-0 text-[12px] font-semibold text-zinc-400 transition hover:text-rose-600"
                                    >
                                        Remove
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-zinc-500">No co-hosts yet.</p>
                )}
            </div>
        </section>
    );
}
