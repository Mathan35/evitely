import { Head, Link, router } from '@inertiajs/react';
import { FormEvent } from 'react';
import { AdminCard, AdminPageHeader, AdminTable } from '@/components/admin/admin-ui';
import { AdminPagination, type Paginator, shortDate } from '@/components/admin/pagination';
import { cn } from '@/lib/utils';

type UserRow = {
    id: number;
    name: string;
    email: string;
    plan: string;
    message_credits: number;
    weddings_count: number;
    email_verified: boolean;
    disabled: boolean;
    plan_ends_at: string | null;
    created_at: string | null;
};

export default function UsersIndex({
    users,
    filters,
}: {
    users: Paginator<UserRow>;
    filters: { q: string; plan: string; status?: string };
}) {
    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(
            '/admin/users',
            {
                q: String(data.get('q') ?? ''),
                plan: String(data.get('plan') ?? ''),
                status: String(data.get('status') ?? ''),
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Users" />
            <AdminPageHeader
                title="Users"
                description="Accounts, plans, lifecycle — deactivate or permanently erase with full data cleanup."
                actions={
                    <a
                        href={`/admin/exports/users?q=${encodeURIComponent(filters.q)}&plan=${encodeURIComponent(filters.plan)}`}
                        className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-zinc-800"
                    >
                        Export CSV
                    </a>
                }
            />
            <form
                onSubmit={search}
                className="mb-4 flex flex-col gap-2 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-[0_1px_0_rgba(24,24,27,0.03)] sm:flex-row sm:flex-wrap sm:items-center"
            >
                <input
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Name or email"
                    className="h-10 flex-1 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 text-[13px] outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
                <select
                    name="plan"
                    defaultValue={filters.plan}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px]"
                >
                    <option value="">All plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                </select>
                <select
                    name="status"
                    defaultValue={filters.status ?? ''}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-[13px]"
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="disabled">Deactivated</option>
                </select>
                <button
                    type="submit"
                    className="h-10 rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white"
                >
                    Filter
                </button>
            </form>
            <AdminCard>
                <AdminTable
                    headers={['User', 'Plan', 'Credits', 'Events', 'Verified', 'Status', 'Joined']}
                    rows={users.data.map((user) => [
                        <Link
                            key={user.id}
                            href={`/admin/users/${user.id}`}
                            className="font-medium text-zinc-950 hover:underline"
                        >
                            <span className="block">{user.name}</span>
                            <span className="font-normal text-zinc-400">{user.email}</span>
                        </Link>,
                        <span
                            key={`${user.id}-plan`}
                            className={cn(
                                'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold',
                                user.plan === 'pro'
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-zinc-100 text-zinc-600',
                            )}
                        >
                            {user.plan}
                        </span>,
                        user.message_credits,
                        user.weddings_count,
                        user.email_verified ? 'Yes' : 'No',
                        <span
                            key={`${user.id}-status`}
                            className={cn(
                                'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold',
                                user.disabled
                                    ? 'bg-rose-50 text-rose-800'
                                    : 'bg-emerald-50 text-emerald-800',
                            )}
                        >
                            {user.disabled ? 'Deactivated' : 'Active'}
                        </span>,
                        shortDate(user.created_at),
                    ])}
                />
                <AdminPagination paginator={users} />
            </AdminCard>
        </>
    );
}
