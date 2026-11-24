import { Form, Head, router, usePage } from '@inertiajs/react';
import { BadgeCheck, Mail } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { StudioCard, StudioEyebrow } from '@/components/studio/studio-surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const getInitials = useInitials();

    if (!user) {
        return null;
    }

    const verified = Boolean(user.email_verified_at);

    return (
        <>
            <Head title="Profile" />

            <div className="min-w-0 space-y-5 sm:space-y-6">
                <StudioCard className="overflow-hidden">
                    <div className="relative overflow-hidden border-b border-zinc-950/8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 px-4 py-6 text-white sm:px-6 sm:py-7 dark:border-white/10">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-emerald-400/20 blur-3xl"
                        />
                        <div className="relative flex items-start gap-4">
                            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg font-semibold tracking-wide ring-1 ring-white/15 backdrop-blur sm:size-16 sm:text-xl">
                                {getInitials(user.name)}
                            </span>
                            <div className="min-w-0">
                                <StudioEyebrow>
                                    <span className="text-white/60">Identity</span>
                                </StudioEyebrow>
                                <h2 className="mt-1.5 truncate font-serif text-[1.75rem] leading-none tracking-tight sm:text-3xl">
                                    {user.name}
                                </h2>
                                <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-white/70">
                                    <Mail className="size-3.5 shrink-0" aria-hidden />
                                    <span className="min-w-0 break-all">{user.email}</span>
                                    {verified ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-emerald-300 uppercase ring-1 ring-emerald-400/25">
                                            <BadgeCheck className="size-3" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
                                            Unverified
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <h3 className="font-serif text-xl tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                            Profile details
                        </h3>
                        <p className="mt-1 text-sm text-pretty text-zinc-500">
                            Update the name and email guests and collaborators see on your account.
                        </p>

                        <Form
                            {...ProfileController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            className="mt-6 space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                className="h-11 rounded-xl"
                                                defaultValue={user.name}
                                                name="name"
                                                required
                                                autoComplete="name"
                                                placeholder="Full name"
                                            />
                                            <InputError className="mt-1" message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                className="h-11 rounded-xl"
                                                defaultValue={user.email}
                                                name="email"
                                                required
                                                autoComplete="username"
                                                placeholder="Email address"
                                            />
                                            <InputError className="mt-1" message={errors.email} />
                                        </div>
                                    </div>

                                    {mustVerifyEmail &&
                                        (user.email_verified_at === null ? (
                                            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
                                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                                    Email verification
                                                </p>
                                                <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-100/70">
                                                    Optional. You can use the studio now, and confirm this address whenever you are ready.
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="mt-3 h-auto px-0 text-amber-900 dark:text-amber-200"
                                                    onClick={() =>
                                                        router.post(
                                                            send.url(),
                                                            {},
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                >
                                                    Send verification email
                                                </Button>
                                                {status === 'verification-link-sent' ? (
                                                    <div className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                                        A verification link has been sent to your email address.
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <p className="inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                                                <BadgeCheck className="size-4" />
                                                This email address is verified.
                                            </p>
                                        ))}

                                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                            className="h-11 w-full rounded-full bg-zinc-950 px-5 text-white hover:bg-zinc-800 sm:w-auto"
                                        >
                                            Save changes
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </StudioCard>

                <StudioCard className="p-4 sm:p-6">
                    <DeleteUser />
                </StudioCard>
            </div>
        </>
    );
}
