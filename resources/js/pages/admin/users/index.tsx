import { Head, Link, router } from '@inertiajs/react';
import { FormEvent } from 'react';
import { AdminCard, AdminPageHeader, AdminTable } from '@/components/admin/admin-ui';
import { AdminPagination, type Paginator, shortDate } from '@/components/admin/pagination';

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

export default function UsersIndex({ users, filters }: { users: Paginator<UserRow>; filters: { q: string; plan: string } }) {
    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/admin/users', { q: String(data.get('q') ?? ''), plan: String(data.get('plan') ?? '') }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Users" />
            <AdminPageHeader
                title="Users"
                description="Accounts, plans, and message credits."
                actions={
                    <a
                        href={`/admin/exports/users?q=${encodeURIComponent(filters.q)}&plan=${encodeURIComponent(filters.plan)}`}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-800"
                    >
                        Export CSV
                    </a>
                }
            />
            <form onSubmit={search} className="mb-3 flex flex-wrap gap-2">
                <input
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Name or email"
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] outline-none"
                />
                <select name="plan" defaultValue={filters.plan} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[13px]">
                    <option value="">All plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                </select>
                <button type="submit" className="h-9 rounded-lg bg-zinc-950 px-3 text-[13px] font-medium text-white">
                    Filter
                </button>
            </form>
            <AdminCard>
                <AdminTable
                    headers={['User', 'Plan', 'Credits', 'Events', 'Verified', 'Status', 'Joined']}
                    rows={users.data.map((user) => [
                        <Link key={user.id} href={`/admin/users/${user.id}`} className="font-medium text-zinc-950 hover:underline">
                            <span className="block">{user.name}</span>
                            <span className="font-normal text-zinc-400">{user.email}</span>
                        </Link>,
                        user.plan,
                        user.message_credits,
                        user.weddings_count,
                        user.email_verified ? 'Yes' : 'No',
                        user.disabled ? 'Disabled' : 'Active',
                        shortDate(user.created_at),
                    ])}
                />
                <AdminPagination paginator={users} />
            </AdminCard>
        </>
    );
}
