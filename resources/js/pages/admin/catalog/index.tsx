import { Head, router } from '@inertiajs/react';
import { AdminCard, AdminPageHeader, AdminTable } from '@/components/admin/admin-ui';

type EventType = { id: number; name: string; slug: string; is_active: boolean };

export default function CatalogIndex({ event_types, live_occasions }: { event_types: EventType[]; live_occasions: string[] }) {
    return (
        <>
            <Head title="Catalog" />
            <AdminPageHeader title="Catalog" description="Event types shown in the studio, plus live occasion keys." />
            <div className="grid gap-3 lg:grid-cols-2">
                <AdminCard title="Event types">
                    <AdminTable
                        headers={['Name', 'Slug', 'Active']}
                        rows={event_types.map((type) => [
                            type.name,
                            type.slug,
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => router.post(`/admin/catalog/event-types/${type.id}`, { is_active: !type.is_active })}
                                className={
                                    type.is_active
                                        ? 'rounded-full bg-zinc-950 px-2.5 py-0.5 text-[11px] font-medium text-white'
                                        : 'rounded-full border border-zinc-200 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500'
                                }
                            >
                                {type.is_active ? 'Active' : 'Hidden'}
                            </button>,
                        ])}
                    />
                </AdminCard>
                <AdminCard title="Live occasions">
                    <ul className="flex flex-wrap gap-2 px-4 py-3">
                        {live_occasions.map((occasion) => (
                            <li key={occasion} className="rounded-full border border-zinc-200 px-2.5 py-1 text-[12px] text-zinc-700">
                                {occasion}
                            </li>
                        ))}
                        {live_occasions.length === 0 ? <li className="text-[13px] text-zinc-400">None.</li> : null}
                    </ul>
                </AdminCard>
            </div>
        </>
    );
}
