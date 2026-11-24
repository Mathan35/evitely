import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
    EditorCheckbox,
    EditorField,
    EditorNotice,
    EditorTextArea,
    EditorTextInput,
} from '@/components/studio/editor-fields';
import { Button } from '@/components/ui/button';
import {
    CORE_SITE_SECTION_KEYS,
    CORE_SITE_SECTION_META,
    coreExtrasFromDetails,
    sampleCoreSiteExtras,
    type CoreSiteSectionKey,
    type ExploreItem,
    type FaqItem,
    type GiftLink,
    type LineupPerson,
    type StayItem,
} from '@/lib/core-site-sections';
import { cn } from '@/lib/utils';

function newRowId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CoreExtrasPanel({
    occasion,
    sections,
    details,
    onSectionsChange,
    onDetailsChange,
}: {
    occasion?: string | null;
    sections: Record<string, boolean>;
    details: Record<string, string>;
    onSectionsChange: (next: Record<string, boolean>) => void;
    onDetailsChange: (next: Record<string, string>) => void;
}) {
    const extras = coreExtrasFromDetails(details, occasion);
    const [openKey, setOpenKey] = useState<CoreSiteSectionKey | null>('faq');

    function setEnabled(key: CoreSiteSectionKey, enabled: boolean): void {
        onSectionsChange({ ...sections, [key]: enabled });
        if (enabled) {
            setOpenKey(key);
        }
    }

    function patchDetails(patch: Record<string, string>): void {
        onDetailsChange({ ...details, ...patch });
    }

    return (
        <div className="mt-4 space-y-3">
            <EditorNotice>
                Custom sections stay hidden until you enable them. Turn one on, edit the copy, and the live
                preview updates instantly.
            </EditorNotice>

            {CORE_SITE_SECTION_KEYS.map((key) => {
                const meta = CORE_SITE_SECTION_META[key];
                const enabled = sections[key] === true;
                const expanded = openKey === key;

                return (
                    <div
                        key={key}
                        className={cn(
                            'rounded-2xl border transition',
                            enabled ? 'border-zinc-900/15 bg-white shadow-sm' : 'border-zinc-950/8 bg-zinc-50/80',
                        )}
                    >
                        <div className="px-2 pt-2">
                            <EditorCheckbox
                                label={meta.label}
                                description={meta.hint}
                                checked={enabled}
                                onCheckedChange={(value) => setEnabled(key, value)}
                            />
                        </div>

                        {enabled ? (
                            <div className="px-3.5 pb-2">
                                <button
                                    type="button"
                                    className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase"
                                    onClick={() => setOpenKey(expanded ? null : key)}
                                >
                                    {expanded ? 'Hide fields' : 'Edit content'}
                                </button>
                            </div>
                        ) : null}

                        {enabled && expanded ? (
                            <div className="space-y-3 border-t border-zinc-950/5 px-3.5 py-3">
                                {key === 'faq' ? (
                                    <FaqEditor
                                        items={extras.faq}
                                        onChange={(faq) => patchDetails({ faq_json: JSON.stringify(faq) })}
                                    />
                                ) : null}
                                {key === 'attire' ? (
                                    <>
                                        <EditorField label="Title">
                                            <EditorTextInput
                                                value={String(details.attire_title ?? extras.attireTitle)}
                                                onChange={(event) =>
                                                    patchDetails({ attire_title: event.target.value })
                                                }
                                            />
                                        </EditorField>
                                        <EditorField label="Guidance">
                                            <EditorTextArea
                                                value={String(details.attire_body ?? extras.attireBody)}
                                                onChange={(event) =>
                                                    patchDetails({ attire_body: event.target.value })
                                                }
                                                rows={3}
                                            />
                                        </EditorField>
                                    </>
                                ) : null}
                                {key === 'gifts' ? (
                                    <>
                                        <EditorField label="Intro">
                                            <EditorTextArea
                                                value={String(details.gifts_intro ?? extras.giftsIntro)}
                                                onChange={(event) =>
                                                    patchDetails({ gifts_intro: event.target.value })
                                                }
                                                rows={2}
                                            />
                                        </EditorField>
                                        <GiftsEditor
                                            items={extras.gifts}
                                            onChange={(gifts) => patchDetails({ gifts_json: JSON.stringify(gifts) })}
                                        />
                                        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl bg-zinc-50/80 px-3.5 py-3 ring-1 ring-zinc-950/5">
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 size-4 rounded border-zinc-300"
                                                checked={['1', 'true', 'yes', 'on'].includes(
                                                    String(details.gifts_claims_enabled ?? '').toLowerCase(),
                                                )}
                                                onChange={(event) =>
                                                    patchDetails({
                                                        gifts_claims_enabled: event.target.checked ? '1' : '0',
                                                    })
                                                }
                                            />
                                            <span>
                                                <span className="block text-[13px] font-semibold text-zinc-900">
                                                    Allow gift claims
                                                </span>
                                                <span className="mt-0.5 block text-[12px] leading-snug text-zinc-500">
                                                    Guests can optionally note which registry item they plan to give —
                                                    you see claims on Manage.
                                                </span>
                                            </span>
                                        </label>
                                    </>
                                ) : null}
                                {key === 'travel_stays' ? (
                                    <>
                                        <EditorField label="Travel notes">
                                            <EditorTextArea
                                                value={String(details.travel_stays_notes ?? extras.travelNotes)}
                                                onChange={(event) =>
                                                    patchDetails({ travel_stays_notes: event.target.value })
                                                }
                                                rows={3}
                                            />
                                        </EditorField>
                                        <StaysEditor
                                            items={extras.stays}
                                            onChange={(stays) =>
                                                patchDetails({ travel_stays_json: JSON.stringify(stays) })
                                            }
                                        />
                                    </>
                                ) : null}
                                {key === 'explore' ? (
                                    <ExploreEditor
                                        items={extras.explore}
                                        onChange={(explore) =>
                                            patchDetails({ explore_json: JSON.stringify(explore) })
                                        }
                                    />
                                ) : null}
                                {key === 'livestream' ? (
                                    <>
                                        <EditorField label="Button label">
                                            <EditorTextInput
                                                value={String(details.livestream_label ?? extras.livestreamLabel)}
                                                onChange={(event) =>
                                                    patchDetails({ livestream_label: event.target.value })
                                                }
                                            />
                                        </EditorField>
                                        <EditorField label="Stream URL">
                                            <EditorTextInput
                                                value={String(details.livestream_url ?? extras.livestreamUrl)}
                                                onChange={(event) =>
                                                    patchDetails({ livestream_url: event.target.value })
                                                }
                                            />
                                        </EditorField>
                                        <EditorField label="Note">
                                            <EditorTextArea
                                                value={String(details.livestream_note ?? extras.livestreamNote)}
                                                onChange={(event) =>
                                                    patchDetails({ livestream_note: event.target.value })
                                                }
                                                rows={2}
                                            />
                                        </EditorField>
                                    </>
                                ) : null}
                                {key === 'lineup' ? (
                                    <LineupEditor
                                        items={extras.lineup}
                                        onChange={(lineup) => patchDetails({ lineup_json: JSON.stringify(lineup) })}
                                    />
                                ) : null}
                                {key === 'wishes' ? (
                                    <EditorField label="Intro">
                                        <EditorTextArea
                                            value={String(details.wishes_intro ?? extras.wishesIntro)}
                                            onChange={(event) =>
                                                patchDetails({ wishes_intro: event.target.value })
                                            }
                                            rows={2}
                                        />
                                    </EditorField>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                );
            })}

            <button
                type="button"
                className="text-[11px] font-semibold text-zinc-500 underline-offset-2 hover:underline"
                onClick={() => {
                    const sample = sampleCoreSiteExtras(occasion);
                    patchDetails({
                        faq_json: JSON.stringify(sample.faq),
                        attire_title: sample.attireTitle,
                        attire_body: sample.attireBody,
                        gifts_intro: sample.giftsIntro,
                        gifts_json: JSON.stringify(sample.gifts),
                        travel_stays_notes: sample.travelNotes,
                        travel_stays_json: JSON.stringify(sample.stays),
                        explore_json: JSON.stringify(sample.explore),
                        livestream_label: sample.livestreamLabel,
                        livestream_url: sample.livestreamUrl,
                        livestream_note: sample.livestreamNote,
                        lineup_json: JSON.stringify(sample.lineup),
                        wishes_intro: sample.wishesIntro,
                    });
                }}
            >
                Fill sample content for all extras
            </button>
        </div>
    );
}

function FaqEditor({ items, onChange }: { items: FaqItem[]; onChange: (next: FaqItem[]) => void }) {
    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={item.id} className="space-y-2 rounded-xl bg-zinc-50 p-2.5 ring-1 ring-zinc-950/5">
                    <EditorTextInput
                        value={item.question}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, question: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Question"
                    />
                    <EditorTextArea
                        value={item.answer}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, answer: event.target.value };
                            onChange(next);
                        }}
                        rows={2}
                        placeholder="Answer"
                    />
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([...items, { id: newRowId('faq'), question: '', answer: '' }])}
            >
                <Plus className="size-3.5" /> Add question
            </Button>
        </div>
    );
}

function GiftsEditor({ items, onChange }: { items: GiftLink[]; onChange: (next: GiftLink[]) => void }) {
    const kinds: Array<NonNullable<GiftLink['kind']>> = [
        'link',
        'amazon',
        'registry',
        'wishlist',
        'upi',
        'cash',
    ];

    return (
        <div className="space-y-2">
            {items.map((item, index) => {
                const kind = item.kind || 'link';
                const isUpi = kind === 'upi' || kind === 'cash';
                return (
                    <div key={item.id} className="grid gap-2 rounded-xl bg-zinc-50 p-2.5 ring-1 ring-zinc-950/5">
                        <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
                            <EditorTextInput
                                value={item.label}
                                onChange={(event) => {
                                    const next = [...items];
                                    next[index] = { ...item, label: event.target.value };
                                    onChange(next);
                                }}
                                placeholder="Label"
                            />
                            <select
                                value={kind}
                                onChange={(event) => {
                                    const next = [...items];
                                    next[index] = {
                                        ...item,
                                        kind: event.target.value as GiftLink['kind'],
                                    };
                                    onChange(next);
                                }}
                                className="h-10 rounded-md border border-zinc-200 bg-white px-2 text-[12px] font-medium"
                            >
                                {kinds.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {isUpi ? (
                            <>
                                <EditorTextInput
                                    value={item.upi_id || ''}
                                    onChange={(event) => {
                                        const next = [...items];
                                        next[index] = { ...item, upi_id: event.target.value };
                                        onChange(next);
                                    }}
                                    placeholder="UPI ID — couple@okaxis"
                                />
                                <EditorTextInput
                                    value={item.amount || ''}
                                    onChange={(event) => {
                                        const next = [...items];
                                        next[index] = { ...item, amount: event.target.value };
                                        onChange(next);
                                    }}
                                    placeholder="Suggested amount (optional) e.g. 2100"
                                />
                            </>
                        ) : (
                            <EditorTextInput
                                value={item.url}
                                onChange={(event) => {
                                    const next = [...items];
                                    next[index] = { ...item, url: event.target.value };
                                    onChange(next);
                                }}
                                placeholder={
                                    kind === 'amazon'
                                        ? 'https://www.amazon.in/hz/wishlist/…'
                                        : 'https://registry or checkout URL'
                                }
                            />
                        )}
                        <EditorTextInput
                            value={item.note || ''}
                            onChange={(event) => {
                                const next = [...items];
                                next[index] = { ...item, note: event.target.value };
                                onChange(next);
                            }}
                            placeholder="Guest-facing note (optional)"
                        />
                    </div>
                );
            })}
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        onChange([
                            ...items,
                            { id: newRowId('gift'), label: '', url: '', kind: 'registry' },
                        ])
                    }
                >
                    <Plus className="size-3.5" /> Add registry link
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        onChange([
                            ...items,
                            {
                                id: newRowId('gift'),
                                label: 'Send via UPI',
                                url: '',
                                kind: 'upi',
                                upi_id: '',
                                amount: '',
                            },
                        ])
                    }
                >
                    <Plus className="size-3.5" /> Add UPI
                </Button>
            </div>
        </div>
    );
}

function StaysEditor({ items, onChange }: { items: StayItem[]; onChange: (next: StayItem[]) => void }) {
    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl bg-zinc-50 p-2.5 ring-1 ring-zinc-950/5">
                    <EditorTextInput
                        value={item.name}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, name: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Hotel name"
                    />
                    <EditorTextInput
                        value={item.detail}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, detail: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Detail"
                    />
                    <EditorTextInput
                        value={item.code || ''}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, code: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Booking code"
                    />
                    <EditorTextInput
                        value={item.url || ''}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, url: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Booking URL"
                    />
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                    onChange([...items, { id: newRowId('stay'), name: '', detail: '', code: '', url: '' }])
                }
            >
                <Plus className="size-3.5" /> Add stay
            </Button>
        </div>
    );
}

function ExploreEditor({ items, onChange }: { items: ExploreItem[]; onChange: (next: ExploreItem[]) => void }) {
    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl bg-zinc-50 p-2.5 ring-1 ring-zinc-950/5">
                    <EditorTextInput
                        value={item.title}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, title: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Place"
                    />
                    <EditorTextArea
                        value={item.note}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, note: event.target.value };
                            onChange(next);
                        }}
                        rows={2}
                        placeholder="Why visit"
                    />
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([...items, { id: newRowId('ex'), title: '', note: '' }])}
            >
                <Plus className="size-3.5" /> Add place
            </Button>
        </div>
    );
}

function LineupEditor({ items, onChange }: { items: LineupPerson[]; onChange: (next: LineupPerson[]) => void }) {
    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl bg-zinc-50 p-2.5 ring-1 ring-zinc-950/5">
                    <EditorTextInput
                        value={item.name}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, name: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Name"
                    />
                    <EditorTextInput
                        value={item.role}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, role: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Role"
                    />
                    <EditorTextInput
                        value={item.blurb || ''}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, blurb: event.target.value };
                            onChange(next);
                        }}
                        placeholder="Short note"
                    />
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([...items, { id: newRowId('p'), name: '', role: '', blurb: '' }])}
            >
                <Plus className="size-3.5" /> Add person
            </Button>
        </div>
    );
}
