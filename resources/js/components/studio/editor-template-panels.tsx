import { router, useForm } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Check,
    ChevronDown,
    Copy,
    ExternalLink,
    Lock,
    Pause,
    Play,
    Plus,
    RefreshCw,
    Smile,
    X,
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type DragEvent,
    type MouseEvent as ReactMouseEvent,
} from 'react';
import { CardCanvas } from '@/components/cards/card-canvas';
import {
    EditorCheckbox,
    EditorField,
    EditorNotice,
    EditorSelect,
    EditorTextArea,
    EditorTextInput,
} from '@/components/studio/editor-fields';
import { EmojiPickerBoard, insertAtSelection } from '@/components/studio/emoji-picker';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    getPreviewMusicOwner,
    playPanelPreview,
    stopPanelPreview,
    subscribePreviewMusic,
} from '@/lib/preview-music-bus';
import { InvitationIntro, buildInvitationIntroContent } from '@/components/invitation/invitation-intro';
import {
    DEFAULT_INTRO_STYLE,
    INTRO_STYLE_OPTIONS,
    resolveIntroStyleId,
    type IntroStyleId,
} from '@/lib/invitation-intro-styles';
import {
    DEFAULT_HERO_STYLE,
    HERO_STYLE_OPTIONS,
    resolveHeroStyleId,
    type HeroStyleId,
} from '@/lib/hero-section-styles';
import {
    DEFAULT_HEADER_STYLE,
    HEADER_STYLE_OPTIONS,
    resolveHeaderStyleId,
    type HeaderStyleId,
} from '@/lib/header-nav-styles';
import {
    DEFAULT_GALLERY_STYLE,
    GALLERY_STYLE_OPTIONS,
    resolveGalleryStyleId,
    type GalleryStyleId,
} from '@/lib/gallery-section-styles';
import { HeroStyleThumb } from '@/components/marketing/site-previews/site-hero-section';
import { HeaderStyleThumb } from '@/components/marketing/site-previews/site-header-nav';
import { GalleryStyleThumb } from '@/components/marketing/site-previews/site-gallery-section';
import {
    BABY_SHOWER_COUNTDOWN_STYLE_OPTIONS,
    DEFAULT_BABY_SHOWER_COUNTDOWN_STYLE,
    isBabyShowerOccasion,
    resolveBabyShowerCountdownStyleId,
} from '@/lib/baby-shower-countdown-styles';
import {
    BIRTHDAY_COUNTDOWN_STYLE_OPTIONS,
    DEFAULT_BIRTHDAY_COUNTDOWN_STYLE,
    isBirthdayOccasion,
    resolveBirthdayCountdownStyleId,
} from '@/lib/birthday-countdown-styles';
import {
    CORPORATE_COUNTDOWN_STYLE_OPTIONS,
    DEFAULT_CORPORATE_COUNTDOWN_STYLE,
    isCorporateOccasion,
    resolveCorporateCountdownStyleId,
} from '@/lib/corporate-countdown-styles';
import {
    COUNTDOWN_TIMER_STYLE_OPTIONS,
    DEFAULT_COUNTDOWN_TIMER_STYLE,
    resolveCountdownTimerStyleId,
} from '@/lib/countdown-timer-styles';
import {
    isCustomCountdownStyle,
    resolveCustomCountdownPack,
    resolveEventCountdownPack,
    resolveEventCountdownStyleId,
} from '@/lib/event-countdown-packs';
import { SectionEnableControl } from '@/components/studio/section-enable-control';
import { copyToClipboard } from '@/lib/clipboard';
import { SITE_BACKGROUND_OPTIONS } from '@/lib/site-backgrounds';
import {
    isSiteSectionEnabled,
    locationSectionPatch,
    SECTION_NOTE_DETAIL_KEYS,
    sectionNoteFromDetails,
} from '@/lib/site-section-visibility';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/use-countdown';
import { BabyShowerCountdownTimer } from '@/components/marketing/site-previews/baby-shower-countdown-timer';
import { BirthdayCountdownTimer } from '@/components/marketing/site-previews/birthday-countdown-timer';
import { CorporateCountdownTimer } from '@/components/marketing/site-previews/corporate-countdown-timer';
import { CountdownTimer } from '@/components/marketing/site-previews/countdown-timer';
import { EventCountdownTimer } from '@/components/marketing/site-previews/event-countdown-timer';
import { resolveCountdownClock, resolveCountdownDate } from '@/lib/preview-countdown';
import {
    MUSIC_LIBRARY,
    type TemplateGallerySlot,
    type TemplateGuestItem,
    type TemplatePreviewModel,
    type TemplateScheduleItem,
    type TemplateVenueBlock,
} from '@/lib/template-preview-model';
import type { CardDocument } from '@/types/wedding';

const TIME_OPTIONS = (() => {
    const options: { value: string; label: string }[] = [];
    for (let hour = 6; hour <= 23; hour += 1) {
        for (const minute of [0, 15, 30, 45]) {
            const hour12 = ((hour + 11) % 12) + 1;
            const suffix = hour < 12 ? 'AM' : 'PM';
            const label = `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
            options.push({ value: label, label });
        }
    }
    return options;
})();

function timeSelectOptions(current: string): { value: string; label: string }[] {
    const value = current.trim();
    if (!value || TIME_OPTIONS.some((option) => option.value === value)) {
        return TIME_OPTIONS;
    }
    return [{ value, label: value }, ...TIME_OPTIONS];
}

/** Hide bundled / template asset paths from editable URL fields. */
function isStockAssetUrl(src: string): boolean {
    const value = src.trim();
    if (!value) {
        return true;
    }
    if (value.startsWith('blob:') || value.startsWith('data:')) {
        return false;
    }
    if (value.startsWith('/storage/') || value.includes('/storage/')) {
        return false;
    }
    if (value.startsWith('http://') || value.startsWith('https://')) {
        try {
            const host = new URL(value).hostname;
            if (host.includes('localhost') || host.endsWith('.test')) {
                return value.includes('/images/');
            }
            return false;
        } catch {
            return false;
        }
    }
    if (value.startsWith('/images/') || value.includes('/images/gallery/')) {
        return true;
    }
    if (value.startsWith('/') && !value.startsWith('/storage/')) {
        return true;
    }
    return false;
}

function editableMediaUrl(src: string): string {
    return isStockAssetUrl(src) ? '' : src;
}

export type LibraryImage = { id: string; label: string; src: string; event_id?: number | null };

export type UserCardOption = {
    event_id: number;
    title: string;
    status: string;
    format: string;
    width?: number;
    height?: number;
    document: CardDocument | null;
    preview_path?: string | null;
    edit_url: string;
    is_current?: boolean;
};

type ContentFieldId =
    | 'kicker'
    | 'hero_message'
    | 'event_line'
    | 'story_eyebrow'
    | 'story_heading'
    | 'story_body'
    | 'gallery_eyebrow'
    | 'gallery_title'
    | 'gallery_intro'
    | 'guests_intro'
    | 'contact_phone'
    | `custom:${string}`;

const CONTENT_FIELDS: { id: Exclude<ContentFieldId, `custom:${string}`>; label: string; group: string; rows?: number }[] = [
    { id: 'kicker', label: 'Kicker line', group: 'Hero' },
    { id: 'hero_message', label: 'Hero message', group: 'Hero', rows: 3 },
    { id: 'event_line', label: 'Event line', group: 'Hero' },
    { id: 'story_eyebrow', label: 'Story label', group: 'Story' },
    { id: 'story_heading', label: 'Story heading', group: 'Story', rows: 2 },
    { id: 'story_body', label: 'Story body', group: 'Story', rows: 4 },
    { id: 'gallery_eyebrow', label: 'Gallery label', group: 'Gallery' },
    { id: 'gallery_title', label: 'Gallery title', group: 'Gallery' },
    { id: 'gallery_intro', label: 'Gallery intro', group: 'Gallery', rows: 2 },
    { id: 'guests_intro', label: 'Guest list intro', group: 'Guests', rows: 2 },
    { id: 'contact_phone', label: 'Contact phone', group: 'Guests' },
];

function readContentField(
    id: Exclude<ContentFieldId, `custom:${string}`>,
    model: TemplatePreviewModel,
    headline: string,
): string {
    if (id === 'kicker') {
        return headline || model.kicker;
    }
    return String(model[id] ?? '');
}

export function ContentTemplatePanel({
    model,
    headline,
    onHeadline: _onHeadline,
    onModel,
    onSelectField,
    sections,
    details,
    onSectionsChange,
    onDetailsChange,
}: {
    model: TemplatePreviewModel;
    headline: string;
    onHeadline: (value: string) => void;
    onModel: (patch: Partial<TemplatePreviewModel>) => void;
    /** Fired when a content layer is chosen — used to scroll/center that block on the live template. */
    onSelectField?: (fieldId: Exclude<ContentFieldId, `custom:${string}`>) => void;
    sections?: Record<string, boolean>;
    details?: Record<string, string>;
    onSectionsChange?: (next: Record<string, boolean>) => void;
    onDetailsChange?: (next: Record<string, string>) => void;
}) {
    const storyEnabled = isSiteSectionEnabled(sections, 'story');
    const storyNote = sectionNoteFromDetails(details, 'story');
    const storyNoteKeys = SECTION_NOTE_DETAIL_KEYS.story;
    // Built-in copy already on every website template — edit only, never add new layers.
    const layers = CONTENT_FIELDS;
    const [selectedId, setSelectedId] = useState<Exclude<ContentFieldId, `custom:${string}`>>('hero_message');
    const [emojiOpen, setEmojiOpen] = useState(false);
    const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const selectedField = layers.find((field) => field.id === selectedId) ?? layers[1];

    useEffect(() => {
        if (!layers.some((field) => field.id === selectedId)) {
            setSelectedId(layers[0].id);
        }
    }, [layers, selectedId]);

    // Align the live template with the default selected layer when this panel opens.
    useEffect(() => {
        onSelectField?.(selectedId);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / remount only (inspector panelKey)
    }, []);

    // Reset caret tracking when switching layers so inserts land at end of the new field.
    useEffect(() => {
        const value = readContentField(selectedId, model, headline);
        selectionRef.current = { start: value.length, end: value.length };
        setEmojiOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when layer changes
    }, [selectedId]);

    function selectField(id: Exclude<ContentFieldId, `custom:${string}`>): void {
        setSelectedId(id);
        onSelectField?.(id);
    }

    function writeBuiltIn(id: Exclude<ContentFieldId, `custom:${string}`>, value: string): void {
        if (id === 'kicker') {
            // patchTemplateModel syncs headline — avoid a second setData that can clobber details.
            onModel({ kicker: value });
            return;
        }
        onModel({ [id]: value } as Partial<TemplatePreviewModel>);
    }

    function rememberSelection(target?: HTMLInputElement | HTMLTextAreaElement | null): void {
        const el = target ?? fieldRef.current;
        if (!el) {
            return;
        }
        selectionRef.current = {
            start: el.selectionStart ?? selectionRef.current.start,
            end: el.selectionEnd ?? selectionRef.current.end,
        };
    }

    function insertEmoji(emoji: string): void {
        const current = readContentField(selectedField.id, model, headline);
        // Prefer live caret if the field still has focus; otherwise use last remembered range.
        const el = fieldRef.current;
        const start = el && document.activeElement === el
            ? (el.selectionStart ?? selectionRef.current.start)
            : selectionRef.current.start;
        const end = el && document.activeElement === el
            ? (el.selectionEnd ?? selectionRef.current.end)
            : selectionRef.current.end;
        const next = insertAtSelection(current, emoji, start, end);
        writeBuiltIn(selectedField.id, next.value);
        selectionRef.current = { start: next.caret, end: next.caret };
        window.requestAnimationFrame(() => {
            const field = fieldRef.current;
            if (!field) {
                return;
            }
            field.focus();
            field.setSelectionRange(next.caret, next.caret);
            rememberSelection(field);
        });
    }

    if (!selectedField) {
        return (
            <div className="mt-3">
                <EditorNotice>No editable copy on this template yet.</EditorNotice>
            </div>
        );
    }

    const fieldValue = readContentField(selectedField.id, model, headline);
    const sharedFieldProps = {
        value: fieldValue,
        onSelect: (event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
            rememberSelection(event.currentTarget),
        onKeyUp: (event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
            rememberSelection(event.currentTarget),
        onClick: (event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
            rememberSelection(event.currentTarget),
        onBlur: (event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
            rememberSelection(event.currentTarget),
    };

    return (
        <div className="mt-3 grid min-w-0 gap-3">
            {sections && details && onSectionsChange && onDetailsChange ? (
                <SectionEnableControl
                    sectionKey="story"
                    enabled={storyEnabled}
                    note={storyNote}
                    onEnabledChange={(enabled) => onSectionsChange({ ...sections, story: enabled })}
                    onNoteChange={(note) =>
                        onDetailsChange({
                            ...details,
                            [storyNoteKeys.title]: note.title,
                            [storyNoteKeys.body]: note.body,
                        })
                    }
                />
            ) : null}
            <EditorNotice>
                Edit the copy already on this template. Place the cursor where you want an emoji, then pick one —
                it inserts at the selection, same as WhatsApp.
            </EditorNotice>
            <div className="min-w-0 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-950/10">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
                    <p className="truncate text-[11px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">
                        {selectedField.group} · {selectedField.label}
                    </p>
                    <button
                        type="button"
                        title="Emojis"
                        aria-expanded={emojiOpen}
                        aria-label={emojiOpen ? 'Close emoji picker' : 'Open emoji picker'}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setEmojiOpen((open) => !open)}
                        className={cn(
                            'emoji-picker-trigger inline-flex size-8 shrink-0 items-center justify-center rounded-full transition',
                            emojiOpen
                                ? 'is-open bg-zinc-900 text-white'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
                        )}
                    >
                        {emojiOpen ? <X className="size-3.5" /> : <Smile className="size-3.5" />}
                    </button>
                </div>
                <div className="space-y-2 p-2.5">
                    {(selectedField.rows ?? 1) > 1 ? (
                        <EditorTextArea
                            ref={(node) => {
                                fieldRef.current = node;
                            }}
                            rows={selectedField.rows}
                            {...sharedFieldProps}
                            onChange={(event) => {
                                rememberSelection(event.currentTarget);
                                writeBuiltIn(selectedField.id, event.target.value);
                            }}
                            className="min-h-20 rounded-xl border-0 bg-[#fcfcfc] shadow-none ring-1 ring-zinc-950/6"
                        />
                    ) : (
                        <EditorTextInput
                            ref={(node) => {
                                fieldRef.current = node;
                            }}
                            {...sharedFieldProps}
                            onChange={(event) => {
                                rememberSelection(event.currentTarget);
                                writeBuiltIn(selectedField.id, event.target.value);
                            }}
                            className="rounded-xl border-0 bg-[#fcfcfc] shadow-none ring-1 ring-zinc-950/6"
                        />
                    )}
                    {emojiOpen ? <EmojiPickerBoard onPick={insertEmoji} /> : null}
                </div>
            </div>

            <div className="min-w-0 space-y-1.5">
                <p className="px-0.5 text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                    Existing layers · {layers.length}
                </p>
                <div className="max-h-56 min-w-0 space-y-1 overflow-y-auto overscroll-contain pr-0.5">
                    {layers.map((field) => {
                        const active = selectedId === field.id;
                        const preview = readContentField(field.id, model, headline).trim() || 'Empty';
                        return (
                            <button
                                key={field.id}
                                type="button"
                                onClick={() => selectField(field.id)}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left ring-1 transition',
                                    active ? 'bg-zinc-900 text-white ring-zinc-900' : 'bg-zinc-50 ring-zinc-950/5 hover:bg-white',
                                )}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[12px] font-semibold">{field.label}</span>
                                    <span className={cn('mt-0.5 block truncate text-[10px]', active ? 'text-white/60' : 'text-zinc-400')}>{preview}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {details && onDetailsChange ? (
                <div className="min-w-0 space-y-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-zinc-950/10">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                            Guest details
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                            Dress code, hashtag, gift note, and RSVP lines used on the invite and card.
                        </p>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        {(
                            [
                                ['dress_code', 'Dress code', 'Festive formal'],
                                ['hashtag', 'Hashtag', '#PriyaAndArun'],
                                ['rsvp_line', 'RSVP line', 'Kindly reply by…'],
                                ['rsvp_phone', 'RSVP phone', '+91…'],
                                ['gift_note', 'Gift note', 'Your presence is enough'],
                                ['hosted_by', 'Hosted by', 'With love from…'],
                                ['compliments', 'Compliments', 'Together with their families'],
                                ['blessing', 'Blessing', 'Optional blessing line'],
                                ['puja_time', 'Puja / ritual time', '10:00 AM'],
                                ['meal_time', 'Meal time', '1:00 PM'],
                            ] as const
                        ).map(([key, label, placeholder]) => (
                            <EditorField key={key} label={label}>
                                <EditorTextInput
                                    value={String(details[key] ?? '')}
                                    placeholder={placeholder}
                                    onChange={(event) =>
                                        onDetailsChange({
                                            ...details,
                                            [key]: event.target.value,
                                        })
                                    }
                                />
                            </EditorField>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function uploadedPhotoUrlFromFlash(flash: unknown): string | null {
    if (!flash || typeof flash !== 'object') {
        return null;
    }
    const url = (flash as { uploaded_photo?: { url?: string } }).uploaded_photo?.url?.trim();
    return url || null;
}

function uploadVenueImage(
    weddingId: number,
    file: File | null,
    apply: (url: string) => void,
): void {
    if (!file) {
        return;
    }

    // Instant live preview — replace with permanent URL when upload flash arrives.
    const previewUrl = URL.createObjectURL(file);
    apply(previewUrl);

    const body = new FormData();
    body.append('photo', file);
    body.append('caption', 'Venue photo');

    let settled = false;
    const removeFlashListener = router.on('flash', (event) => {
        const flash = (event as CustomEvent).detail?.flash;
        const url = uploadedPhotoUrlFromFlash(flash);
        if (!url || settled) {
            return;
        }
        settled = true;
        apply(url);
        URL.revokeObjectURL(previewUrl);
    });

    router.post(`/events/${weddingId}/photos`, body, {
        forceFormData: true,
        preserveScroll: true,
        preserveState: true,
        onFinish: () => {
            window.setTimeout(() => removeFlashListener(), 250);
        },
        onError: () => {
            removeFlashListener();
        },
    });
}

function VenueEditor({
    label,
    weddingId,
    venue,
    onChange,
}: {
    label: string;
    weddingId: number;
    venue: TemplateVenueBlock;
    onChange: (next: TemplateVenueBlock) => void;
}) {
    const venueRef = useRef(venue);
    venueRef.current = venue;
    const photoInputValue = editableMediaUrl(venue.image);
    const mapsUrl = venue.maps_url.trim();
    const qrValue = mapsUrl || venue.address.trim();
    const timeOptions = useMemo(() => timeSelectOptions(venue.time), [venue.time]);
    const displayImage = (venue.image || '').trim();

    function patchVenue(patch: Partial<TemplateVenueBlock>): void {
        const next = { ...venueRef.current, ...patch };
        venueRef.current = next;
        onChange(next);
    }

    return (
        <section className="space-y-4 rounded-2xl bg-white p-3.5 ring-1 ring-zinc-950/5">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">{label}</p>

            <div className="grid gap-3">
                <EditorField label="Title">
                    <EditorTextInput value={venue.title} onChange={(event) => patchVenue({ title: event.target.value })} />
                </EditorField>
                <EditorField label="Space name">
                    <EditorTextInput value={venue.name} onChange={(event) => patchVenue({ name: event.target.value })} />
                </EditorField>
                <EditorField label="Time">
                    <EditorSelect
                        value={venue.time || TIME_OPTIONS[0]?.value}
                        options={timeOptions}
                        placeholder="Select time"
                        onValueChange={(time) => patchVenue({ time })}
                    />
                </EditorField>
                <EditorField label="Address">
                    <EditorTextArea rows={2} value={venue.address} onChange={(event) => patchVenue({ address: event.target.value })} />
                </EditorField>
            </div>

            <div className="grid gap-3 border-t border-zinc-100 pt-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Venue photo</p>
                {displayImage ? (
                    <img key={displayImage} src={displayImage} alt="" className="aspect-[16/9] w-full rounded-xl object-cover ring-1 ring-zinc-950/5" />
                ) : (
                    <div className="grid aspect-[16/9] place-items-center rounded-xl bg-zinc-100 text-[12px] text-zinc-400 ring-1 ring-zinc-950/5">
                        No photo yet
                    </div>
                )}
                <EditorField label="Upload photo">
                    <EditorTextInput
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) =>
                            uploadVenueImage(weddingId, event.target.files?.[0] ?? null, (url) =>
                                patchVenue({ image: url }),
                            )
                        }
                    />
                </EditorField>
                <EditorField label="Or paste photo URL" hint="Leave blank to keep the template photo">
                    <EditorTextInput
                        value={photoInputValue}
                        placeholder="https://…/venue.jpg"
                        onChange={(event) => {
                            const next = event.target.value.trim();
                            const current = venueRef.current.image;
                            patchVenue({
                                image: next || (isStockAssetUrl(current) ? current : ''),
                            });
                        }}
                    />
                </EditorField>
            </div>

            <div className="grid gap-3 border-t border-zinc-100 pt-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Map & scan</p>
                <EditorField label="Directions URL" hint="QR code is generated from this link">
                    <EditorTextInput
                        value={mapsUrl}
                        placeholder="https://maps.google.com/…"
                        onChange={(event) =>
                            patchVenue({
                                maps_url: event.target.value,
                                map_image: '',
                            })
                        }
                    />
                </EditorField>
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-3 ring-1 ring-zinc-950/5">
                    <div className="grid size-[4.75rem] place-items-center rounded-xl bg-white ring-1 ring-zinc-950/5">
                        {qrValue ? (
                            <QRCodeSVG value={qrValue} size={64} fgColor="#18181b" bgColor="transparent" />
                        ) : (
                            <span className="px-2 text-center text-[10px] leading-tight text-zinc-400">Add a URL</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-zinc-800">Scan preview</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                            Guests scan this code for directions. Built automatically from the URL above.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function LocationTemplatePanel({
    weddingId,
    model,
    venueName,
    venueAddress,
    city,
    sections,
    details,
    onVenueName,
    onVenueAddress,
    onCity,
    onModel,
    onSectionsChange,
    onDetailsChange,
}: {
    weddingId: number;
    model: TemplatePreviewModel;
    venueName: string;
    venueAddress: string;
    city: string;
    sections: Record<string, boolean>;
    details: Record<string, string>;
    onVenueName: (value: string) => void;
    onVenueAddress: (value: string) => void;
    onCity: (value: string) => void;
    onModel: (patch: Partial<TemplatePreviewModel>) => void;
    onSectionsChange: (next: Record<string, boolean>) => void;
    onDetailsChange: (next: Record<string, string>) => void;
}) {
    const [pendingScheduleRemove, setPendingScheduleRemove] = useState<number | null>(null);
    const pendingItem = pendingScheduleRemove != null ? model.schedule[pendingScheduleRemove] : null;
    const locationEnabled = isSiteSectionEnabled(sections, 'venue');
    const locationNote = sectionNoteFromDetails(details, 'venue');
    const noteKeys = SECTION_NOTE_DETAIL_KEYS.venue;

    return (
        <div className="mt-4 grid gap-5">
            <SectionEnableControl
                sectionKey="venue"
                enabled={locationEnabled}
                note={locationNote}
                onEnabledChange={(enabled) =>
                    onSectionsChange({ ...sections, ...locationSectionPatch(enabled) })
                }
                onNoteChange={(note) =>
                    onDetailsChange({
                        ...details,
                        [noteKeys.title]: note.title,
                        [noteKeys.body]: note.body,
                    })
                }
            />

            {locationEnabled ? (
                <>
            <EditorNotice>
                Itinerary moments sync to your calendar links and guest site. Update the shared place, times, and each venue — map codes come from the directions URL.
            </EditorNotice>

            <section className="grid gap-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Shared place</p>
                <EditorField label="Venue name">
                    <EditorTextInput value={venueName || model.venue_name} onChange={(event) => onVenueName(event.target.value)} />
                </EditorField>
                <EditorField label="City">
                    <EditorTextInput value={city || model.city} onChange={(event) => onCity(event.target.value)} />
                </EditorField>
                <EditorField label="Address">
                    <EditorTextInput value={venueAddress || model.venue_address} onChange={(event) => onVenueAddress(event.target.value)} />
                </EditorField>
            </section>

            <section className="grid gap-3">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Itinerary</p>
                <div className="grid grid-cols-[8.5rem_minmax(0,1fr)_auto] gap-2 px-0.5">
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Time</span>
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Moment</span>
                    <span className="w-16" />
                </div>
                <div className="space-y-2">
                    {model.schedule.map((item, index) => (
                        <div
                            key={`${item.title}-${index}`}
                            className="grid grid-cols-[8.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl bg-zinc-50 p-2 ring-1 ring-zinc-950/5"
                        >
                            <EditorSelect
                                value={item.time || TIME_OPTIONS[0]?.value}
                                options={timeSelectOptions(item.time)}
                                placeholder="Time"
                                onValueChange={(time) => {
                                    const schedule = [...model.schedule];
                                    schedule[index] = { ...item, time };
                                    onModel({ schedule });
                                }}
                            />
                            <EditorTextInput
                                value={item.title}
                                placeholder="Moment title"
                                onChange={(event) => {
                                    const schedule = [...model.schedule];
                                    schedule[index] = { ...item, title: event.target.value };
                                    onModel({ schedule });
                                }}
                            />
                            <button
                                type="button"
                                className="h-11 w-16 rounded-full text-[12px] font-medium text-rose-600 hover:bg-rose-50"
                                onClick={() => setPendingScheduleRemove(index)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full"
                    onClick={() => onModel({ schedule: [...model.schedule, { time: '6:00 PM', title: 'New moment' }] })}
                >
                    Add itinerary item
                </Button>
            </section>

            <VenueEditor
                label={`${model.ceremony.title || 'Primary'} venue`}
                weddingId={weddingId}
                venue={model.ceremony}
                onChange={(ceremony) => onModel({ ceremony })}
            />
            <VenueEditor
                label={`${model.reception.title || 'Secondary'} venue`}
                weddingId={weddingId}
                venue={model.reception}
                onChange={(reception) => onModel({ reception })}
            />
                </>
            ) : null}

            <ConfirmDialog
                open={pendingScheduleRemove != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingScheduleRemove(null);
                    }
                }}
                title="Remove this itinerary item?"
                description={
                    pendingItem
                        ? `“${pendingItem.title || 'Untitled moment'}” will be removed from the schedule.`
                        : undefined
                }
                confirmLabel="Remove item"
                tone="danger"
                onConfirm={() => {
                    if (pendingScheduleRemove == null) {
                        return;
                    }
                    onModel({ schedule: model.schedule.filter((_, i) => i !== pendingScheduleRemove) });
                    setPendingScheduleRemove(null);
                }}
            />
        </div>
    );
}

function PremiumDefaultOptionsNotice({
    locked,
    upgradeUrl,
    noun = 'styles',
}: {
    locked?: boolean;
    upgradeUrl?: string | null;
    noun?: string;
}) {
    if (!locked) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white px-3.5 py-3 text-[12px] leading-relaxed text-zinc-600">
            <p className="font-semibold text-zinc-900">Default is free on trial</p>
            <p className="mt-1">
                Browse every {noun} below — locked ones need a site pack. Your guests keep the default look until you
                upgrade.
            </p>
            {upgradeUrl ? (
                <a
                    href={upgradeUrl}
                    className="mt-2 inline-flex text-[12px] font-semibold text-amber-900 underline-offset-2 hover:underline"
                >
                    View site plans →
                </a>
            ) : null}
        </div>
    );
}

function StyleOptionLockBadge() {
    return (
        <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-zinc-950/90 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase shadow-sm backdrop-blur-sm">
            <Lock className="size-3" strokeWidth={2.5} />
            Pro
        </span>
    );
}

function goToUpgrade(upgradeUrl?: string | null): void {
    if (upgradeUrl) {
        window.location.assign(upgradeUrl);
    }
}

export function HeroImagePanel({
    weddingId,
    model,
    libraryImages,
    onModel,
    optionsLocked = false,
    upgradeUrl,
}: {
    weddingId: number;
    model: TemplatePreviewModel;
    libraryImages: LibraryImage[];
    onModel: (patch: Partial<TemplatePreviewModel>) => void;
    optionsLocked?: boolean;
    upgradeUrl?: string | null;
}) {
    const heroImage = (model.hero_image || '').trim();
    const upload = useForm<{ photo: File | null; caption: string; as_hero: boolean }>({
        photo: null,
        caption: 'Hero background',
        as_hero: true,
    });
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);
    const displaySrc = pendingPreview || heroImage;
    const heroOnModelRef = useRef(onModel);
    heroOnModelRef.current = onModel;
    const blur = model.hero_blur ?? 0;
    const zoom = model.hero_zoom ?? 1;
    const posX = model.hero_position_x ?? 50;
    const posY = model.hero_position_y ?? 50;
    const defaultHeroSrc = useMemo(() => {
        const stock = libraryImages.find((image) => isStockAssetUrl(image.src));
        if (stock) {
            return stock.src;
        }
        if (heroImage && isStockAssetUrl(heroImage)) {
            return heroImage;
        }
        return heroImage || libraryImages[0]?.src || '';
    }, [libraryImages, heroImage]);

    useEffect(() => {
        if (!optionsLocked || !defaultHeroSrc) {
            return;
        }
        if (heroImage && heroImage !== defaultHeroSrc && !isStockAssetUrl(heroImage)) {
            onModel({ hero_image: defaultHeroSrc });
        }
    }, [optionsLocked, defaultHeroSrc, heroImage, onModel]);

    return (
        <div className="mt-4 space-y-4">
            <PremiumDefaultOptionsNotice
                locked={optionsLocked}
                upgradeUrl={upgradeUrl}
                noun="hero photos"
            />
            <EditorNotice>Hero photo — adjust crop, zoom, and blur. The live preview updates instantly.</EditorNotice>
            <div className="overflow-hidden rounded-2xl ring-1 ring-zinc-950/5">
                <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                    {displaySrc ? (
                        <img
                            key={displaySrc}
                            src={displaySrc}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{
                                objectPosition: `${posX}% ${posY}%`,
                                transform: `scale(${zoom})`,
                                filter: `blur(${blur}px)`,
                                transformOrigin: `${posX}% ${posY}%`,
                            }}
                        />
                    ) : (
                        <div className="grid h-full place-items-center text-[12px] text-zinc-400">No hero image yet</div>
                    )}
                </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-white p-3.5 ring-1 ring-zinc-950/5">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Image adjust</p>
                <EditorField label={`Blur · ${blur.toFixed(1)}px`}>
                    <input
                        type="range"
                        min={0}
                        max={12}
                        step={0.5}
                        value={blur}
                        onChange={(event) => onModel({ hero_blur: Number(event.target.value) })}
                        className="w-full"
                    />
                </EditorField>
                <EditorField label={`Zoom · ${zoom.toFixed(2)}×`}>
                    <input
                        type="range"
                        min={1}
                        max={2.2}
                        step={0.02}
                        value={zoom}
                        onChange={(event) => onModel({ hero_zoom: Number(event.target.value) })}
                        className="w-full"
                    />
                </EditorField>
                <div className="grid grid-cols-2 gap-3">
                    <EditorField label={`Crop X · ${Math.round(posX)}%`}>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={posX}
                            onChange={(event) => onModel({ hero_position_x: Number(event.target.value) })}
                            className="w-full"
                        />
                    </EditorField>
                    <EditorField label={`Crop Y · ${Math.round(posY)}%`}>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={posY}
                            onChange={(event) => onModel({ hero_position_y: Number(event.target.value) })}
                            className="w-full"
                        />
                    </EditorField>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-full"
                    onClick={() => onModel({ hero_blur: 0, hero_zoom: 1, hero_position_x: 50, hero_position_y: 50 })}
                >
                    Reset adjust
                </Button>
            </div>

            {optionsLocked ? (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-950/8 bg-zinc-50/80 p-3.5">
                    <StyleOptionLockBadge />
                    <p className="pr-16 text-[13px] font-semibold text-zinc-900">Custom hero upload</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                        Free plan keeps the template default photo. Unlock uploads and your library with a site pack.
                    </p>
                    {upgradeUrl ? (
                        <button
                            type="button"
                            onClick={() => goToUpgrade(upgradeUrl)}
                            className="mt-2 text-[12px] font-semibold text-amber-900 underline-offset-2 hover:underline"
                        >
                            View site plans →
                        </button>
                    ) : null}
                </div>
            ) : (
                <>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const file = upload.data.photo;
                            if (file) {
                                setPendingPreview(URL.createObjectURL(file));
                            }
                            let settled = false;
                            const removeFlashListener = router.on('flash', (event) => {
                                const url = uploadedPhotoUrlFromFlash((event as CustomEvent).detail?.flash);
                                if (!url || settled) {
                                    return;
                                }
                                settled = true;
                                heroOnModelRef.current({ hero_image: url });
                                setPendingPreview(null);
                            });
                            upload.post(`/events/${weddingId}/photos`, {
                                forceFormData: true,
                                preserveScroll: true,
                                preserveState: true,
                                onFinish: () => {
                                    window.setTimeout(() => removeFlashListener(), 250);
                                    upload.reset();
                                    upload.setData('as_hero', true);
                                },
                                onError: () => {
                                    removeFlashListener();
                                    setPendingPreview(null);
                                },
                            });
                        }}
                    >
                        <EditorField label="Upload custom image">
                            <EditorTextInput
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) => upload.setData('photo', event.target.files?.[0] ?? null)}
                            />
                        </EditorField>
                        <Button type="submit" disabled={upload.processing || !upload.data.photo} className="h-10 rounded-full px-5">
                            Upload & use
                        </Button>
                    </form>

                    <EditorField label="Or paste image URL" hint="Leave blank to keep the template hero">
                        <EditorTextInput
                            value={editableMediaUrl(heroImage)}
                            onChange={(event) => {
                                const next = event.target.value.trim();
                                onModel({ hero_image: next || (isStockAssetUrl(heroImage) ? heroImage : '') });
                            }}
                            placeholder="https://…/hero.jpg"
                        />
                    </EditorField>
                </>
            )}

            <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">From templates & your events</p>
                <div className="grid grid-cols-2 gap-2.5">
                    {libraryImages.map((image) => {
                        const isDefault =
                            image.src === defaultHeroSrc
                            || (isStockAssetUrl(image.src) && image.src === heroImage);
                        const locked = optionsLocked && !isDefault;

                        return (
                            <button
                                key={image.id}
                                type="button"
                                onClick={() => {
                                    if (locked) {
                                        goToUpgrade(upgradeUrl);
                                        return;
                                    }
                                    onModel({ hero_image: image.src });
                                }}
                                className={cn(
                                    'relative overflow-hidden rounded-2xl text-left ring-1 transition',
                                    heroImage === image.src ? 'ring-2 ring-zinc-900' : 'ring-zinc-950/5 hover:ring-zinc-400',
                                    locked && 'opacity-90',
                                )}
                            >
                                {locked ? <StyleOptionLockBadge /> : null}
                                <img
                                    src={image.src}
                                    alt=""
                                    className={cn('aspect-[4/3] w-full object-cover', locked && 'opacity-70')}
                                />
                                <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-zinc-600">
                                    {isDefault && optionsLocked ? `Default · ${image.label}` : image.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const SHOWCASE_PARTY_OPTIONS = Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const label = n === 1 ? '1 guest' : `${n} guests`;
    return { value: label, label };
});

const SHOWCASE_STATUS_OPTIONS = [
    { value: 'Attending', label: 'Attending' },
    { value: 'Maybe', label: 'Maybe' },
    { value: 'Regrets', label: 'Regrets' },
];

function normalizePartyLabel(value: string): string {
    const trimmed = value.trim();
    if (SHOWCASE_PARTY_OPTIONS.some((option) => option.value === trimmed)) {
        return trimmed;
    }
    const count = Number.parseInt(trimmed.replace(/[^\d]/g, ''), 10);
    if (Number.isFinite(count) && count >= 1) {
        const n = Math.min(8, count);
        return n === 1 ? '1 guest' : `${n} guests`;
    }
    return '1 guest';
}

function normalizeStatusLabel(value: string): string {
    const trimmed = value.trim();
    const match = SHOWCASE_STATUS_OPTIONS.find(
        (option) => option.value.toLowerCase() === trimmed.toLowerCase(),
    );
    return match?.value ?? 'Attending';
}

/** Public “Who is coming” showcase on the site — not the private Guests / RSVP book. */
export function GuestsTemplatePanel({
    guests,
    guestsIntro,
    sections,
    details,
    onChange,
    onIntroChange,
    onSectionsChange,
    onDetailsChange,
    guestsStudioHref = '/guests',
    manageRsvpsHref,
}: {
    guests: TemplateGuestItem[];
    guestsIntro: string;
    sections: Record<string, boolean>;
    details: Record<string, string>;
    onChange: (next: TemplateGuestItem[]) => void;
    onIntroChange: (next: string) => void;
    onSectionsChange: (next: Record<string, boolean>) => void;
    onDetailsChange: (next: Record<string, string>) => void;
    guestsStudioHref?: string;
    /** Event manage page RSVP inbox (creator replies). */
    manageRsvpsHref?: string;
}) {
    const [draft, setDraft] = useState({ name: '', party: '1 guest', status: 'Attending' });
    const [pendingGuestRemove, setPendingGuestRemove] = useState<number | null>(null);
    const pendingGuest = pendingGuestRemove != null ? guests[pendingGuestRemove] : null;
    const guestsEnabled = isSiteSectionEnabled(sections, 'guests');
    const guestsNote = sectionNoteFromDetails(details, 'guests');
    const noteKeys = SECTION_NOTE_DETAIL_KEYS.guests;
    const rsvpEnabled = isSiteSectionEnabled(sections, 'rsvp');
    const rsvpNote = sectionNoteFromDetails(details, 'rsvp');
    const rsvpNoteKeys = SECTION_NOTE_DETAIL_KEYS.rsvp;
    const guestbookEnabled = isSiteSectionEnabled(sections, 'guestbook');
    const guestbookNote = sectionNoteFromDetails(details, 'guestbook');
    const guestbookNoteKeys = SECTION_NOTE_DETAIL_KEYS.guestbook;

    function patchGuest(index: number, patch: Partial<TemplateGuestItem>): void {
        onChange(guests.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    }

    return (
        <div className="mt-4 space-y-4">
            <SectionEnableControl
                sectionKey="guests"
                enabled={guestsEnabled}
                note={guestsNote}
                onEnabledChange={(enabled) => onSectionsChange({ ...sections, guests: enabled })}
                onNoteChange={(note) =>
                    onDetailsChange({
                        ...details,
                        [noteKeys.title]: note.title,
                        [noteKeys.body]: note.body,
                    })
                }
            />
            <SectionEnableControl
                sectionKey="rsvp"
                enabled={rsvpEnabled}
                note={rsvpNote}
                onEnabledChange={(enabled) => onSectionsChange({ ...sections, rsvp: enabled })}
                onNoteChange={(note) =>
                    onDetailsChange({
                        ...details,
                        [rsvpNoteKeys.title]: note.title,
                        [rsvpNoteKeys.body]: note.body,
                    })
                }
            />
            <SectionEnableControl
                sectionKey="guestbook"
                enabled={guestbookEnabled}
                note={guestbookNote}
                onEnabledChange={(enabled) => onSectionsChange({ ...sections, guestbook: enabled })}
                onNoteChange={(note) =>
                    onDetailsChange({
                        ...details,
                        [guestbookNoteKeys.title]: note.title,
                        [guestbookNoteKeys.body]: note.body,
                    })
                }
            />

            {manageRsvpsHref ? (
                <a
                    href={manageRsvpsHref}
                    className="block rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-3.5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-700/80 uppercase">
                        Creator inbox
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-zinc-950">View submitted RSVPs</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                        Open Manage to see every reply guests send from your live invitation.
                    </p>
                </a>
            ) : null}

            {guestsEnabled ? (
                <>
            <EditorNotice>
                This is only the public “Who is coming” showcase on your site — not your private invite list. Add real
                invitees (with personal links) on Manage → Guests
                {manageRsvpsHref ? (
                    <>
                        {' '}
                        (
                        <a
                            href={manageRsvpsHref.replace(/#.*$/, '') + '#guests'}
                            className="font-semibold text-zinc-900 underline-offset-2 hover:underline"
                        >
                            open Guests
                        </a>
                        )
                    </>
                ) : null}
                . Directory:{' '}
                <a href={guestsStudioHref} className="font-semibold text-zinc-900 underline-offset-2 hover:underline">
                    Guests
                </a>
                {manageRsvpsHref ? (
                    <>
                        {' '}
                        · replies:{' '}
                        <a
                            href={manageRsvpsHref}
                            className="font-semibold text-zinc-900 underline-offset-2 hover:underline"
                        >
                            RSVP inbox
                        </a>
                    </>
                ) : null}
                .
            </EditorNotice>

            <EditorField label="Section intro" hint="Shown above the names">
                <EditorTextArea
                    value={guestsIntro}
                    rows={2}
                    placeholder="Friends and family joining the celebration…"
                    onChange={(event) => onIntroChange(event.target.value)}
                />
            </EditorField>

            <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                    Showcase names ({guests.length})
                </p>
                {guests.length > 0 ? (
                    <button
                        type="button"
                        className="text-[11px] font-medium text-zinc-500 transition hover:text-rose-600"
                        onClick={() => onChange([])}
                    >
                        Clear all
                    </button>
                ) : null}
            </div>

            {guests.length === 0 ? (
                <EditorNotice>
                    No showcase names yet — the “Who is coming” block stays hidden until you add at least one.
                </EditorNotice>
            ) : (
                <div className="space-y-2">
                    {guests.map((guest, index) => (
                        <div
                            key={guest.id || `${guest.name}-${index}`}
                            className="grid gap-2 rounded-2xl bg-zinc-100/70 p-2.5 ring-1 ring-zinc-950/5"
                        >
                            <EditorField label="Name">
                                <EditorTextInput
                                    value={guest.name}
                                    onChange={(event) => patchGuest(index, { name: event.target.value })}
                                    placeholder="Guest name"
                                />
                            </EditorField>
                            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                                <EditorField label="Party">
                                    <EditorSelect
                                        value={normalizePartyLabel(guest.party)}
                                        onValueChange={(party) => patchGuest(index, { party })}
                                        options={SHOWCASE_PARTY_OPTIONS}
                                    />
                                </EditorField>
                                <EditorField label="Status">
                                    <EditorSelect
                                        value={normalizeStatusLabel(guest.status)}
                                        onValueChange={(status) => patchGuest(index, { status })}
                                        options={SHOWCASE_STATUS_OPTIONS}
                                    />
                                </EditorField>
                                <button
                                    type="button"
                                    className="mb-1 px-2 text-[12px] font-medium text-rose-600"
                                    onClick={() => setPendingGuestRemove(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={pendingGuestRemove != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingGuestRemove(null);
                    }
                }}
                title="Remove this guest?"
                description={
                    pendingGuest
                        ? `“${pendingGuest.name || 'Unnamed guest'}” will be removed from the site showcase.`
                        : undefined
                }
                confirmLabel="Remove guest"
                tone="danger"
                onConfirm={() => {
                    if (pendingGuestRemove == null) {
                        return;
                    }
                    onChange(guests.filter((_, i) => i !== pendingGuestRemove));
                    setPendingGuestRemove(null);
                }}
            />

            <div className="grid gap-2 border-t border-zinc-200/70 pt-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Add to showcase</p>
                <EditorField label="Name">
                    <EditorTextInput
                        placeholder="Name"
                        value={draft.name}
                        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    />
                </EditorField>
                <div className="grid grid-cols-2 gap-2">
                    <EditorField label="Party">
                        <EditorSelect
                            value={draft.party}
                            onValueChange={(party) => setDraft((current) => ({ ...current, party }))}
                            options={SHOWCASE_PARTY_OPTIONS}
                        />
                    </EditorField>
                    <EditorField label="Status">
                        <EditorSelect
                            value={draft.status}
                            onValueChange={(status) => setDraft((current) => ({ ...current, status }))}
                            options={SHOWCASE_STATUS_OPTIONS}
                        />
                    </EditorField>
                </div>
                <Button
                    type="button"
                    className="h-10 rounded-full"
                    disabled={!draft.name.trim()}
                    onClick={() => {
                        const name = draft.name.trim();
                        onChange([
                            ...guests,
                            {
                                id: `guest-${Date.now()}`,
                                name,
                                party: normalizePartyLabel(draft.party),
                                status: normalizeStatusLabel(draft.status),
                            },
                        ]);
                        setDraft({ name: '', party: '1 guest', status: 'Attending' });
                    }}
                >
                    <Plus className="mr-1.5 size-3.5" aria-hidden />
                    Add guest
                </Button>
            </div>
                </>
            ) : null}
        </div>
    );
}

export function InvitationCardPanel({
    userCards,
    selectedUserCardEventId,
    createCardUrl,
    cardVisible,
    onSelectUserCard,
    onToggleVisible,
    onRefresh,
}: {
    userCards: UserCardOption[];
    selectedUserCardEventId: string;
    createCardUrl: string;
    cardVisible: boolean;
    onSelectUserCard: (eventId: string) => void;
    onToggleVisible: (visible: boolean) => void;
    onRefresh?: () => void;
}) {
    const [refreshing, setRefreshing] = useState(false);
    const refreshingRef = useRef(false);
    const onRefreshRef = useRef(onRefresh);
    onRefreshRef.current = onRefresh;

    function refreshCards(): void {
        if (refreshingRef.current) {
            return;
        }
        refreshingRef.current = true;
        setRefreshing(true);

        const finish = (): void => {
            refreshingRef.current = false;
            setRefreshing(false);
        };

        if (onRefreshRef.current) {
            onRefreshRef.current();
            window.setTimeout(finish, 600);
            return;
        }

        router.reload({
            only: ['userCards', 'selectedUserCard'],
            onFinish: finish,
        });
    }

    // Related cards are edited in a new tab — pull fresh documents when the user returns.
    useEffect(() => {
        let timer: number | undefined;

        const softReload = (): void => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                if (document.visibilityState !== 'visible') {
                    return;
                }
                refreshCards();
            }, 280);
        };

        const onVisibility = (): void => {
            if (document.visibilityState === 'visible') {
                softReload();
            }
        };

        window.addEventListener('focus', softReload);
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('focus', softReload);
            document.removeEventListener('visibilitychange', onVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mt-4 space-y-4">
            <EditorNotice>
                Showing cards from this event type only. Pick one for “The Card” section — or hide the section entirely.
            </EditorNotice>

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3.5 py-3 ring-1 ring-zinc-950/5">
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900">Show invitation card</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                        {cardVisible ? 'Visible on the live website preview' : 'Hidden from the website'}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={cardVisible}
                    onClick={() => onToggleVisible(!cardVisible)}
                    className={cn(
                        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                        cardVisible ? 'bg-zinc-900' : 'bg-zinc-300',
                    )}
                >
                    <span
                        className={cn(
                            'absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform',
                            cardVisible && 'translate-x-5',
                        )}
                    />
                </button>
            </div>

            <div className={cn('space-y-3 transition-opacity', !cardVisible && 'pointer-events-none opacity-45')}>
                <div className="flex flex-wrap items-center gap-2">
                    <Button asChild className="h-10 rounded-full">
                        <a href={createCardUrl} target="_blank" rel="noreferrer">
                            Create new card
                            <ExternalLink className="ml-1.5 size-3.5 opacity-70" />
                        </a>
                    </Button>
                    <p className="w-full text-[11px] text-zinc-500">
                        Opens the card designs gallery for this event type — pick a template, then refresh this list.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-2 px-0.5">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Your cards</p>
                    <button
                        type="button"
                        onClick={refreshCards}
                        disabled={refreshing || !cardVisible}
                        title="Refresh cards"
                        aria-label="Refresh cards"
                        className="inline-flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                    >
                        <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
                    </button>
                </div>

                {userCards.length === 0 ? (
                    <EditorNotice>
                        No cards yet. Create one in a new tab, then tap refresh to load it here.
                    </EditorNotice>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {userCards.map((card) => {
                            const selected = cardVisible && String(card.event_id) === selectedUserCardEventId;
                            return (
                                <button
                                    key={card.event_id}
                                    type="button"
                                    disabled={!cardVisible}
                                    onClick={() => onSelectUserCard(String(card.event_id))}
                                    className={cn(
                                        'rounded-2xl p-3 text-left transition ring-1',
                                        selected
                                            ? 'bg-white shadow-sm ring-2 ring-zinc-900'
                                            : 'bg-zinc-50 ring-zinc-950/5 hover:bg-white',
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="grid h-28 w-20 place-items-center overflow-hidden rounded-xl bg-zinc-200">
                                            {card.preview_path ? (
                                                <img src={card.preview_path} alt="" className="h-full w-full object-cover" />
                                            ) : card.document ? (
                                                <div className="flex h-full w-full items-start justify-center overflow-hidden pt-1">
                                                    <CardCanvas
                                                        document={card.document}
                                                        width={card.width || 1080}
                                                        height={card.height || 1440}
                                                        fitWidth={72}
                                                        className="!mx-0"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-zinc-500">No preview</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-semibold text-zinc-900">{card.title}</p>
                                            <p className="mt-1 text-[11px] text-zinc-500">
                                                {card.format} · {card.status}
                                                {card.is_current ? ' · this event' : ''}
                                            </p>
                                            {selected ? (
                                                <p className="mt-2 text-[10px] font-semibold tracking-[0.12em] text-zinc-900 uppercase">
                                                    Selected
                                                </p>
                                            ) : null}
                                            <a
                                                href={card.edit_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-zinc-700 underline-offset-2 hover:underline"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                Edit card
                                                <ExternalLink className="size-3 opacity-60" />
                                            </a>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export function PhotosTemplatePanel({
    weddingId,
    gallery,
    sections,
    details,
    onChange,
    onSectionsChange,
    onDetailsChange,
}: {
    weddingId: number;
    gallery: TemplateGallerySlot[];
    sections: Record<string, boolean>;
    details: Record<string, string>;
    onChange: (next: TemplateGallerySlot[]) => void;
    onSectionsChange: (next: Record<string, boolean>) => void;
    onDetailsChange: (next: Record<string, string>) => void;
}) {
    const urlDraft = useRef<Record<string, string>>({});
    const galleryRef = useRef(gallery);
    galleryRef.current = gallery;
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const addInputRef = useRef<HTMLInputElement>(null);
    const photosEnabled = isSiteSectionEnabled(sections, 'gallery');
    const photosNote = sectionNoteFromDetails(details, 'gallery');
    const noteKeys = SECTION_NOTE_DETAIL_KEYS.gallery;

    function commitGallery(next: TemplateGallerySlot[]): void {
        galleryRef.current = next;
        onChange(next);
    }

    function applyFile(slotId: string, file: File | null): void {
        if (!file) {
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        const withPreview = galleryRef.current.map((slot) =>
            slot.id === slotId ? { ...slot, src: objectUrl } : slot,
        );
        commitGallery(withPreview);
        const body = new FormData();
        body.append('photo', file);
        body.append('caption', galleryRef.current.find((slot) => slot.id === slotId)?.title ?? '');
        let settled = false;
        const removeFlashListener = router.on('flash', (event) => {
            const url = uploadedPhotoUrlFromFlash((event as CustomEvent).detail?.flash);
            if (!url || settled) {
                return;
            }
            settled = true;
            commitGallery(
                galleryRef.current.map((slot) => (slot.id === slotId ? { ...slot, src: url } : slot)),
            );
            URL.revokeObjectURL(objectUrl);
        });
        router.post(`/events/${weddingId}/photos`, body, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onFinish: () => window.setTimeout(() => removeFlashListener(), 250),
            onError: () => removeFlashListener(),
        });
    }

    function addPhoto(file: File | null): void {
        if (!file) {
            return;
        }
        const id = `photo-${Date.now()}`;
        const objectUrl = URL.createObjectURL(file);
        const next: TemplateGallerySlot = {
            id,
            title: file.name.replace(/\.[^.]+$/, '') || 'New photo',
            note: 'New photo',
            src: objectUrl,
            span: 'square',
            zoom: 1,
            position_x: 50,
            position_y: 50,
        };
        commitGallery([...galleryRef.current, next]);
        const body = new FormData();
        body.append('photo', file);
        body.append('caption', next.title);
        let settled = false;
        const removeFlashListener = router.on('flash', (event) => {
            const url = uploadedPhotoUrlFromFlash((event as CustomEvent).detail?.flash);
            if (!url || settled) {
                return;
            }
            settled = true;
            commitGallery(
                galleryRef.current.map((slot) => (slot.id === id ? { ...slot, src: url } : slot)),
            );
            URL.revokeObjectURL(objectUrl);
        });
        router.post(`/events/${weddingId}/photos`, body, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onFinish: () => window.setTimeout(() => removeFlashListener(), 250),
            onError: () => removeFlashListener(),
        });
    }

    function patchSlot(slotId: string, patch: Partial<TemplateGallerySlot>): void {
        commitGallery(galleryRef.current.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot)));
    }

    return (
        <div className="mt-4 space-y-5">
            <SectionEnableControl
                sectionKey="gallery"
                enabled={photosEnabled}
                note={photosNote}
                onEnabledChange={(enabled) => onSectionsChange({ ...sections, gallery: enabled })}
                onNoteChange={(note) =>
                    onDetailsChange({
                        ...details,
                        [noteKeys.title]: note.title,
                        [noteKeys.body]: note.body,
                    })
                }
            />

            {photosEnabled ? (
                <>
            <EditorNotice>Update any tile, or add a new image to the gallery.</EditorNotice>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                    Gallery · {gallery.length}
                </p>
                <div>
                    <input
                        ref={addInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                            addPhoto(event.target.files?.[0] ?? null);
                            event.target.value = '';
                        }}
                    />
                    <Button
                        type="button"
                        className="h-9 gap-1.5 rounded-full px-3.5 text-[12px]"
                        onClick={() => addInputRef.current?.click()}
                    >
                        <Plus className="size-3.5" />
                        Add image
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {gallery.length === 0 ? (
                    <EditorNotice>No photos yet — tap Add image to start the gallery.</EditorNotice>
                ) : null}
                {gallery.map((slot) => (
                    <article key={slot.id} className="overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-950/5">
                        <div className="grid grid-cols-[5.5rem_1fr] gap-3 p-2.5">
                            <div className="aspect-square overflow-hidden rounded-xl bg-zinc-200">
                                <img
                                    src={slot.src}
                                    alt={slot.title}
                                    className="h-full w-full object-cover"
                                    style={{
                                        objectPosition: `${slot.position_x ?? 50}% ${slot.position_y ?? 50}%`,
                                        transform: `scale(${slot.zoom ?? 1})`,
                                        transformOrigin: `${slot.position_x ?? 50}% ${slot.position_y ?? 50}%`,
                                    }}
                                />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <EditorTextInput
                                    value={slot.title}
                                    onChange={(event) => patchSlot(slot.id, { title: event.target.value })}
                                />
                                <EditorTextInput
                                    value={slot.note}
                                    onChange={(event) => patchSlot(slot.id, { note: event.target.value })}
                                />
                                <button
                                    type="button"
                                    className="text-[11px] font-medium text-rose-600"
                                    onClick={() => commitGallery(galleryRef.current.filter((item) => item.id !== slot.id))}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 border-t border-zinc-200/70 px-2.5 py-2.5">
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400 uppercase">Crop & zoom</p>
                            <EditorField label={`Zoom · ${(slot.zoom ?? 1).toFixed(2)}×`}>
                                <input
                                    type="range"
                                    min={1}
                                    max={2.2}
                                    step={0.02}
                                    value={slot.zoom ?? 1}
                                    onChange={(event) => patchSlot(slot.id, { zoom: Number(event.target.value) })}
                                    className="w-full"
                                />
                            </EditorField>
                            <div className="grid grid-cols-2 gap-2">
                                <EditorField label={`X · ${Math.round(slot.position_x ?? 50)}%`}>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={slot.position_x ?? 50}
                                        onChange={(event) => patchSlot(slot.id, { position_x: Number(event.target.value) })}
                                        className="w-full"
                                    />
                                </EditorField>
                                <EditorField label={`Y · ${Math.round(slot.position_y ?? 50)}%`}>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={slot.position_y ?? 50}
                                        onChange={(event) => patchSlot(slot.id, { position_y: Number(event.target.value) })}
                                        className="w-full"
                                    />
                                </EditorField>
                            </div>
                        </div>
                        <div className="space-y-2 border-t border-zinc-200/70 px-2.5 py-2.5">
                            <label
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setDragOverId(slot.id);
                                }}
                                onDragLeave={() => setDragOverId(null)}
                                onDrop={(event: DragEvent<HTMLLabelElement>) => {
                                    event.preventDefault();
                                    setDragOverId(null);
                                    applyFile(slot.id, event.dataTransfer.files?.[0] ?? null);
                                }}
                                className={cn(
                                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-3 py-3 text-center transition',
                                    dragOverId === slot.id ? 'border-zinc-900 bg-zinc-900/5' : 'border-zinc-300 bg-white',
                                )}
                            >
                                <span className="text-[12px] font-semibold text-zinc-800">Replace image</span>
                                <span className="mt-0.5 text-[11px] text-zinc-500">Upload or drop</span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(event) => applyFile(slot.id, event.target.files?.[0] ?? null)}
                                />
                            </label>
                            <div className="flex gap-2">
                                <EditorTextInput
                                    placeholder="https://…/photo.jpg"
                                    onChange={(event) => {
                                        urlDraft.current[slot.id] = event.target.value;
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 shrink-0 rounded-full"
                                    onClick={() => {
                                        const url = (urlDraft.current[slot.id] || '').trim();
                                        if (url) {
                                            commitGallery(
                                                galleryRef.current.map((item) =>
                                                    item.id === slot.id ? { ...item, src: url } : item,
                                                ),
                                            );
                                        }
                                    }}
                                >
                                    Use URL
                                </Button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
                </>
            ) : null}
        </div>
    );
}

export function MusicTemplatePanel({
    weddingId,
    musicUrl,
    musicEnabled,
    onUrl,
    onEnabled,
    optionsLocked = false,
    upgradeUrl,
}: {
    weddingId: number;
    musicUrl: string;
    musicEnabled: boolean;
    onUrl: (value: string) => void;
    onEnabled: (value: boolean) => void;
    optionsLocked?: boolean;
    upgradeUrl?: string | null;
}) {
    const form = useForm<{ music: File | null }>({ music: null });
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const previewingTrackRef = useRef<string | null>(null);
    const defaultTrack = MUSIC_LIBRARY[0];

    useEffect(() => {
        if (!optionsLocked || !defaultTrack) {
            return;
        }
        if (musicUrl && musicUrl !== defaultTrack.url) {
            onUrl(defaultTrack.url);
        }
    }, [optionsLocked, defaultTrack, musicUrl, onUrl]);

    function stopPreview(): void {
        previewingTrackRef.current = null;
        setPreviewingId(null);
        stopPanelPreview();
    }

    useEffect(() => () => stopPreview(), []);

    useEffect(() => {
        return subscribePreviewMusic(() => {
            if (getPreviewMusicOwner() !== 'panel') {
                previewingTrackRef.current = null;
                setPreviewingId(null);
                return;
            }
            setPreviewingId(previewingTrackRef.current);
        });
    }, []);

    function selectTrack(url: string): void {
        onUrl(url);
        onEnabled(true);
    }

    function togglePreview(track: { id: string; url: string }, event: ReactMouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (previewingId === track.id) {
            stopPreview();
            return;
        }

        previewingTrackRef.current = track.id;
        setPreviewingId(track.id);
        playPanelPreview(track.url);
    }

    return (
        <div className="mt-4 space-y-4">
            <EditorCheckbox
                checked={musicEnabled}
                onCheckedChange={(enabled) => {
                    if (!enabled) {
                        stopPreview();
                    }
                    onEnabled(enabled);
                    if (enabled && optionsLocked && defaultTrack) {
                        onUrl(defaultTrack.url);
                    }
                }}
                label="Enable background music"
                description="Selected track plays on the site when guests tap the audio icon."
            />
            <PremiumDefaultOptionsNotice locked={optionsLocked} upgradeUrl={upgradeUrl} noun="music tracks" />
            <EditorNotice>
                Use the play button to hear a track. Free plan keeps the default selected — locked tracks need a site
                pack.
            </EditorNotice>
            <div className="max-h-72 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
                {MUSIC_LIBRARY.map((track) => {
                    const selected = musicEnabled && musicUrl === track.url;
                    const previewing = previewingId === track.id;
                    const locked = Boolean(optionsLocked && defaultTrack && track.id !== defaultTrack.id);

                    return (
                        <div
                            key={track.id}
                            className={cn(
                                'relative flex w-full items-center gap-2 rounded-2xl px-2 py-2 ring-1 transition',
                                selected
                                    ? 'bg-zinc-900 text-white ring-zinc-900'
                                    : 'bg-zinc-100/80 ring-zinc-950/5 hover:bg-white',
                            )}
                        >
                            {locked ? (
                                <span className="absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-zinc-950/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                                    <Lock className="size-2.5" strokeWidth={2.5} />
                                    Pro
                                </span>
                            ) : null}
                            <button
                                type="button"
                                title={previewing ? 'Pause preview' : 'Play preview'}
                                aria-label={previewing ? `Pause ${track.label}` : `Play ${track.label}`}
                                onClick={(event) => togglePreview(track, event)}
                                className={cn(
                                    'grid size-9 shrink-0 place-items-center rounded-full transition',
                                    selected
                                        ? 'bg-white/15 text-white hover:bg-white/25'
                                        : 'bg-white text-zinc-800 ring-1 ring-zinc-950/10 hover:bg-zinc-50',
                                )}
                            >
                                {previewing ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (locked) {
                                        goToUpgrade(upgradeUrl);
                                        return;
                                    }
                                    stopPreview();
                                    selectTrack(track.url);
                                }}
                                className="min-w-0 flex-1 rounded-xl px-1.5 py-1.5 text-left text-[13px] font-semibold"
                            >
                                <span className="block truncate pr-10">
                                    {!locked && optionsLocked && track.id === defaultTrack?.id
                                        ? `Default · ${track.label}`
                                        : track.label}
                                </span>
                                <span className={cn('mt-0.5 block text-[10px] font-medium', selected ? 'text-white/55' : 'text-zinc-400')}>
                                    {locked
                                        ? 'Preview with play · unlock to use'
                                        : selected
                                          ? 'Selected for site'
                                          : 'Tap to select'}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
            {optionsLocked ? (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-950/8 bg-zinc-50/80 p-3.5">
                    <StyleOptionLockBadge />
                    <p className="pr-16 text-[13px] font-semibold text-zinc-900">Custom URL & upload</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                        Paste a link or upload your own audio after you choose a site pack.
                    </p>
                    {upgradeUrl ? (
                        <button
                            type="button"
                            onClick={() => goToUpgrade(upgradeUrl)}
                            className="mt-2 text-[12px] font-semibold text-amber-900 underline-offset-2 hover:underline"
                        >
                            View site plans →
                        </button>
                    ) : null}
                </div>
            ) : (
                <>
                    <EditorField label="Music URL">
                        <EditorTextInput
                            value={musicUrl}
                            onChange={(event) => {
                                stopPreview();
                                onUrl(event.target.value);
                            }}
                        />
                    </EditorField>
                    <form
                        className="space-y-3 border-t border-zinc-200/70 pt-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            stopPreview();
                            form.post(`/events/${weddingId}/music`, {
                                forceFormData: true,
                                preserveScroll: true,
                                onSuccess: () => form.reset(),
                            });
                        }}
                    >
                        <EditorField label="Upload audio">
                            <EditorTextInput
                                type="file"
                                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a"
                                onChange={(event) => form.setData('music', event.target.files?.[0] ?? null)}
                            />
                        </EditorField>
                        <Button type="submit" disabled={form.processing || !form.data.music} className="h-10 rounded-full px-5">
                            Upload music
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}

export function SiteLinkPanel({
    slug,
    shareUrl,
    pathUrl,
    subdomainUrl,
    subdomainHost,
    subdomainsEnabled,
    inviteRootDomain,
    customSubdomainLocked = false,
    upgradeUrl,
    onSlug,
}: {
    slug: string;
    shareUrl: string;
    pathUrl?: string | null;
    subdomainUrl?: string | null;
    subdomainHost?: string | null;
    subdomainsEnabled?: boolean;
    inviteRootDomain?: string | null;
    /** Trial / unpaid: show subdomain as a paid upgrade, keep path free. */
    customSubdomainLocked?: boolean;
    upgradeUrl?: string | null;
    onSlug: (value: string) => void;
}) {
    const subdomainOk = Boolean(subdomainsEnabled) && !customSubdomainLocked;
    const showSubdomainUpsell = Boolean(subdomainsEnabled) && customSubdomainLocked;
    const [mode, setMode] = useState<'default' | 'path' | 'subdomain'>(
        subdomainOk ? 'subdomain' : 'path',
    );
    const [copied, setCopied] = useState(false);

    const origin = useMemo(() => {
        try {
            return new URL(shareUrl).origin;
        } catch {
            return typeof window !== 'undefined' ? window.location.origin : '';
        }
    }, [shareUrl]);

    const inviteBase = useMemo(() => {
        try {
            const url = new URL(pathUrl || shareUrl);
            return `${url.origin}/invite/`;
        } catch {
            return `${origin}/invite/`;
        }
    }, [origin, pathUrl, shareUrl]);

    const rootHost =
        (inviteRootDomain || '').trim() ||
        (typeof window !== 'undefined' ? window.location.host.replace(/^www\./, '') : 'evitely.com');

    const sanitizeSlug = (value: string): string =>
        value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

    const pathLiveUrl = `${inviteBase}${slug || 'your-event'}`;
    const subdomainLiveUrl =
        subdomainUrl ||
        `${typeof window !== 'undefined' && window.location.protocol ? window.location.protocol : 'https:'}//${slug || 'your-event'}.${rootHost}/`;
    const subdomainPreview = subdomainHost || `${slug || 'your-event'}.${rootHost}`;
    const activeMode = !subdomainOk && mode === 'subdomain' ? 'path' : mode;
    const activeUrl =
        activeMode === 'subdomain'
            ? subdomainLiveUrl
            : activeMode === 'path'
              ? pathLiveUrl
              : shareUrl;

    async function copyActiveLink(): Promise<void> {
        const ok = await copyToClipboard(activeUrl);
        if (!ok) {
            return;
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    }

    return (
        <div className="mt-4 grid gap-3.5">
            <EditorNotice>
                {subdomainOk
                    ? 'Path and subdomain share the same short name — change it once, both links update. Publish uses your preferred guest link.'
                    : 'Your guests open a short path link. Choose a memorable name below — Publish opens this same URL.'}
            </EditorNotice>

            {showSubdomainUpsell ? (
                <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white px-3.5 py-3 text-[12px] leading-relaxed text-zinc-600 ring-1 ring-amber-950/5">
                    <p className="font-semibold text-zinc-900">Custom subdomain is on paid site plans</p>
                    <p className="mt-1">
                        Trial guests use the path link below. Unlock{' '}
                        <span className="font-medium text-zinc-800">you.{rootHost}</span> with a site pack.
                    </p>
                    {upgradeUrl ? (
                        <a
                            href={upgradeUrl}
                            className="mt-2 inline-flex text-[12px] font-semibold text-amber-900 underline-offset-2 hover:underline"
                        >
                            View site plans →
                        </a>
                    ) : null}
                </div>
            ) : !subdomainOk ? (
                <p className="rounded-2xl bg-zinc-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-zinc-500 ring-1 ring-zinc-950/5">
                    Short subdomain links (like{' '}
                    <span className="font-medium text-zinc-700">you.{rootHost}</span>) aren’t available
                    on this workspace — the path link below is what guests receive.
                </p>
            ) : null}

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={() => setMode('default')}
                    className={cn(
                        'w-full rounded-2xl px-3.5 py-3 text-left ring-1 transition',
                        activeMode === 'default'
                            ? 'bg-white shadow-sm ring-2 ring-zinc-900'
                            : 'bg-zinc-50 ring-zinc-950/5 hover:bg-white',
                    )}
                >
                    <p className="text-[13px] font-semibold text-zinc-900">Preferred guest link</p>
                    <p className="mt-1 break-all text-[12px] text-zinc-500">{shareUrl}</p>
                </button>

                <button
                    type="button"
                    onClick={() => setMode('path')}
                    className={cn(
                        'w-full rounded-2xl px-3.5 py-3 text-left ring-1 transition',
                        activeMode === 'path'
                            ? 'bg-white shadow-sm ring-2 ring-zinc-900'
                            : 'bg-zinc-50 ring-zinc-950/5 hover:bg-white',
                    )}
                >
                    <p className="text-[13px] font-semibold text-zinc-900">
                        {subdomainOk ? 'Custom path' : 'Guest path'}
                    </p>
                    <p className="mt-1 text-[12px] text-zinc-500">
                        {inviteBase.replace(/^https?:\/\//, '')}
                        <span className="font-semibold text-zinc-700">{slug || 'emma-and-alex'}</span>
                    </p>
                </button>

                {subdomainOk ? (
                    <button
                        type="button"
                        onClick={() => setMode('subdomain')}
                        className={cn(
                            'relative w-full rounded-2xl px-3.5 py-3 text-left ring-1 transition hover:bg-white',
                            activeMode === 'subdomain'
                                ? 'bg-white shadow-sm ring-2 ring-zinc-900'
                                : 'bg-zinc-50 ring-zinc-950/5',
                        )}
                    >
                        <p className="text-[13px] font-semibold text-zinc-900">Custom subdomain</p>
                        <p className="mt-1 break-all text-[12px] text-zinc-500">{subdomainPreview}</p>
                    </button>
                ) : null}
            </div>

            {activeMode === 'default' ? (
                <div className="rounded-2xl bg-zinc-100/80 px-4 py-3 ring-1 ring-zinc-950/5">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Guest link</p>
                    <p className="mt-1 break-all text-[12px] text-zinc-700">{shareUrl}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void copyActiveLink()}
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-zinc-800 underline-offset-2 hover:underline"
                        >
                            {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3 opacity-60" />}
                            {copied ? 'Copied' : 'Copy link'}
                        </button>
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-zinc-800 underline-offset-2 hover:underline"
                        >
                            Open link
                            <ExternalLink className="size-3 opacity-60" />
                        </a>
                    </div>
                </div>
            ) : null}

            {activeMode === 'path' || activeMode === 'subdomain' ? (
                <div className="space-y-3 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-zinc-950/10">
                    <EditorField
                        label={activeMode === 'subdomain' ? 'Subdomain label' : 'Path after domain'}
                        hint="Lowercase letters, numbers, and hyphens"
                    >
                        <div className="flex min-w-0 items-center gap-0 overflow-hidden rounded-xl ring-1 ring-zinc-950/10">
                            <span className="shrink-0 bg-zinc-50 px-3 py-2.5 text-[12px] text-zinc-500">
                                {activeMode === 'subdomain' ? (
                                    <span className="text-zinc-400">https://</span>
                                ) : (
                                    inviteBase.replace(/^https?:\/\//, '')
                                )}
                            </span>
                            <EditorTextInput
                                value={slug}
                                onChange={(event) => onSlug(sanitizeSlug(event.target.value))}
                                className="rounded-none border-0 shadow-none ring-0 focus-visible:ring-0"
                                placeholder="emma-and-alex"
                            />
                            {activeMode === 'subdomain' ? (
                                <span className="shrink-0 bg-zinc-50 px-3 py-2.5 text-[12px] text-zinc-500">
                                    .{rootHost}
                                </span>
                            ) : null}
                        </div>
                    </EditorField>
                    <div className="rounded-xl bg-zinc-50 px-3 py-2.5">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                            {activeMode === 'subdomain' ? 'Subdomain link' : 'Path link'}
                        </p>
                        <p className="mt-1 break-all text-[12px] text-zinc-700">
                            {activeMode === 'subdomain' ? subdomainLiveUrl : pathLiveUrl}
                        </p>
                        <button
                            type="button"
                            onClick={() => void copyActiveLink()}
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-zinc-800 underline-offset-2 hover:underline"
                        >
                            {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3 opacity-60" />}
                            {copied ? 'Copied' : 'Copy link'}
                        </button>
                        {activeMode === 'subdomain' && pathUrl ? (
                            <p className="mt-2 break-all text-[11px] text-zinc-400">
                                Path alias still works: {pathLiveUrl}
                            </p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function IntroStyleThumb({
    styleId,
    active,
    playing,
    paper,
    ink,
    seal,
    initials,
}: {
    styleId: IntroStyleId;
    active: boolean;
    /** Play the intro animation in the option card (selected or local preview). */
    playing?: boolean;
    paper: string;
    ink: string;
    seal: string;
    initials: string;
}) {
    const showPreview = Boolean(playing || active);
    const [playKey, setPlayKey] = useState(0);

    useEffect(() => {
        if (!showPreview) {
            return;
        }
        setPlayKey((value) => value + 1);
    }, [showPreview, styleId]);

    const content = useMemo(
        () =>
            buildInvitationIntroContent({
                hosts: initials.includes('&') ? initials.replace(/\s+/g, ' ') : 'Emma & Alexander',
                paper,
                ink,
                seal,
                guestName: 'Guest',
            }),
        [initials, ink, paper, seal],
    );

    return (
        <div className="relative h-[7.25rem] w-full overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-950/10">
            {showPreview ? (
                <InvitationIntro
                    key={`${styleId}-${playKey}`}
                    content={{ ...content, initials }}
                    style={styleId}
                    compact
                    showPreparing
                    preparingMs={700}
                    autoOpen
                    autoOpenMs={900}
                    loop
                    className="!absolute inset-0 z-[1]"
                />
            ) : (
                <div
                    className={cn(
                        'absolute inset-0 flex flex-col items-center justify-center px-2 text-center',
                        `invitation-intro invitation-intro--${styleId} invitation-intro--compact`,
                    )}
                    style={
                        {
                            ['--intro-paper' as string]: paper,
                            ['--intro-ink' as string]: ink,
                            ['--intro-seal' as string]: seal,
                        } as CSSProperties
                    }
                    aria-hidden
                >
                    <span className="font-serif text-[13px] tracking-wide text-[var(--intro-ink)]">{initials}</span>
                    <span className="mt-1 text-[8px] tracking-[0.2em] text-[var(--intro-ink)]/55 uppercase">Preview</span>
                </div>
            )}
            {!showPreview ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/25 to-transparent px-2 py-1.5">
                    <span className="text-[9px] font-semibold tracking-wide text-white/95 uppercase">Tap to preview</span>
                </div>
            ) : null}
        </div>
    );
}

export function HeroStylePanel({
    heroStyle,
    onChange,
    optionsLocked = false,
    upgradeUrl,
}: {
    heroStyle: string;
    onChange: (next: HeroStyleId) => void;
    optionsLocked?: boolean;
    upgradeUrl?: string | null;
}) {
    const activeId = resolveHeroStyleId(heroStyle);

    useEffect(() => {
        if (optionsLocked && activeId !== DEFAULT_HERO_STYLE) {
            onChange(DEFAULT_HERO_STYLE);
        }
    }, [optionsLocked, activeId, onChange]);

    return (
        <div className="mt-4 space-y-4">
            <PremiumDefaultOptionsNotice locked={optionsLocked} upgradeUrl={upgradeUrl} noun="hero layouts" />
            <EditorNotice>
                Advanced hero layouts for the top of your site — every event type can use them. The live
                preview updates as soon as you pick one.
            </EditorNotice>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {HERO_STYLE_OPTIONS.map((option) => {
                    const selected = activeId === option.id;
                    const locked = optionsLocked && option.id !== DEFAULT_HERO_STYLE;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                if (locked) {
                                    goToUpgrade(upgradeUrl);
                                    return;
                                }
                                onChange(option.id);
                            }}
                            className={cn(
                                'relative rounded-2xl border p-3 text-left transition',
                                selected
                                    ? 'border-zinc-950 bg-white shadow-md ring-2 ring-zinc-950/10 dark:border-white dark:ring-white/20'
                                    : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                locked && 'opacity-90',
                            )}
                        >
                            {locked ? <StyleOptionLockBadge /> : null}
                            <div className={cn(locked && 'opacity-70')}>
                                <HeroStyleThumb styleId={option.id} active={selected && !locked} />
                            </div>
                            <span className="mt-2.5 block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                {option.id === DEFAULT_HERO_STYLE && optionsLocked
                                    ? `Default · ${option.label}`
                                    : option.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                                {locked ? 'Unlock with a site pack' : option.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function HeaderStylePanel({
    headerStyle,
    onChange,
    optionsLocked = false,
    upgradeUrl,
}: {
    headerStyle: string;
    onChange: (next: HeaderStyleId) => void;
    optionsLocked?: boolean;
    upgradeUrl?: string | null;
}) {
    const activeId = resolveHeaderStyleId(headerStyle);

    useEffect(() => {
        if (optionsLocked && activeId !== DEFAULT_HEADER_STYLE) {
            onChange(DEFAULT_HEADER_STYLE);
        }
    }, [optionsLocked, activeId, onChange]);

    return (
        <div className="mt-6 space-y-4">
            <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Header & links</p>
                <PremiumDefaultOptionsNotice
                    locked={optionsLocked}
                    upgradeUrl={upgradeUrl}
                    noun="header styles"
                />
                <EditorNotice className="mt-2">
                    Advanced sticky header and navigation link designs. Works across every event type.
                </EditorNotice>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {HEADER_STYLE_OPTIONS.map((option) => {
                    const selected = activeId === option.id;
                    const locked = optionsLocked && option.id !== DEFAULT_HEADER_STYLE;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                if (locked) {
                                    goToUpgrade(upgradeUrl);
                                    return;
                                }
                                onChange(option.id);
                            }}
                            className={cn(
                                'relative rounded-2xl border p-3 text-left transition',
                                selected
                                    ? 'border-zinc-950 bg-white shadow-md ring-2 ring-zinc-950/10 dark:border-white dark:ring-white/20'
                                    : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                locked && 'opacity-90',
                            )}
                        >
                            {locked ? <StyleOptionLockBadge /> : null}
                            <div className={cn(locked && 'opacity-70')}>
                                <HeaderStyleThumb styleId={option.id} active={selected && !locked} />
                            </div>
                            <span className="mt-2.5 block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                {option.id === DEFAULT_HEADER_STYLE && optionsLocked
                                    ? `Default · ${option.label}`
                                    : option.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                                {locked ? 'Unlock with a site pack' : option.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function GalleryStylePanel({
    galleryStyle,
    onChange,
    optionsLocked = false,
    upgradeUrl,
}: {
    galleryStyle: string;
    onChange: (next: GalleryStyleId) => void;
    optionsLocked?: boolean;
    upgradeUrl?: string | null;
}) {
    const activeId = resolveGalleryStyleId(galleryStyle);

    useEffect(() => {
        if (optionsLocked && activeId !== DEFAULT_GALLERY_STYLE) {
            onChange(DEFAULT_GALLERY_STYLE);
        }
    }, [optionsLocked, activeId, onChange]);

    return (
        <div className="mt-1 space-y-4">
            <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">Gallery layout</p>
                <PremiumDefaultOptionsNotice
                    locked={optionsLocked}
                    upgradeUrl={upgradeUrl}
                    noun="gallery layouts"
                />
                <EditorNotice className="mt-2">
                    Ten responsive photo layouts — mosaic, masonry, carousel, hover cards, lightbox strip, and more.
                    The live preview updates as soon as you pick one.
                </EditorNotice>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {GALLERY_STYLE_OPTIONS.map((option) => {
                    const selected = activeId === option.id;
                    const locked = optionsLocked && option.id !== DEFAULT_GALLERY_STYLE;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                if (locked) {
                                    goToUpgrade(upgradeUrl);
                                    return;
                                }
                                onChange(option.id);
                            }}
                            className={cn(
                                'relative rounded-2xl border p-3 text-left transition',
                                selected
                                    ? 'border-zinc-950 bg-white shadow-md ring-2 ring-zinc-950/10 dark:border-white dark:ring-white/20'
                                    : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                locked && 'opacity-90',
                            )}
                        >
                            {locked ? <StyleOptionLockBadge /> : null}
                            <div className={cn(locked && 'opacity-70')}>
                                <GalleryStyleThumb styleId={option.id} active={selected && !locked} />
                            </div>
                            <span className="mt-2.5 block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                {option.id === DEFAULT_GALLERY_STYLE && optionsLocked
                                    ? `Default · ${option.label}`
                                    : option.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                                {locked ? 'Unlock with a site pack' : option.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function IntroStylePanel({
    introStyle,
    hosts,
    paper,
    ink,
    seal,
    onChange,
    optionsLocked = false,
    upgradeUrl,
}: {
    introStyle: string;
    hosts?: string | null;
    paper?: string | null;
    ink?: string | null;
    seal?: string | null;
    onChange: (next: IntroStyleId) => void;
    optionsLocked?: boolean;
    upgradeUrl?: string | null;
}) {
    const activeId = resolveIntroStyleId(introStyle);
    const [previewId, setPreviewId] = useState<IntroStyleId | null>(null);
    const initials = useMemo(() => {
        const parts = (hosts || 'Emma & Alexander')
            .split(/\s*&\s*|\s+and\s+/i)
            .map((part) => part.trim())
            .filter(Boolean);
        if (parts.length >= 2) {
            return `${(parts[0][0] || 'E').toUpperCase()} & ${(parts[1][0] || 'A').toUpperCase()}`;
        }
        return 'E & A';
    }, [hosts]);
    const palette = {
        paper: (paper || '').trim() || '#f9ebe7',
        ink: (ink || '').trim() || '#7a514d',
        seal: (seal || '').trim() || '#a67068',
    };

    useEffect(() => {
        if (optionsLocked && activeId !== DEFAULT_INTRO_STYLE) {
            onChange(DEFAULT_INTRO_STYLE);
        }
    }, [optionsLocked, activeId, onChange]);

    return (
        <div className="mt-4 space-y-4">
            <PremiumDefaultOptionsNotice locked={optionsLocked} upgradeUrl={upgradeUrl} noun="intro animations" />
            <EditorNotice>
                Tap any style to preview the animation here. Free plan keeps the default selected — unlock others with
                a site pack.
            </EditorNotice>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {INTRO_STYLE_OPTIONS.map((option) => {
                    const selected = activeId === option.id;
                    const locked = optionsLocked && option.id !== DEFAULT_INTRO_STYLE;
                    const playing = selected || previewId === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                setPreviewId(option.id);
                                if (locked) {
                                    return;
                                }
                                onChange(option.id);
                            }}
                            className={cn(
                                'relative rounded-2xl border p-3 text-left transition',
                                selected
                                    ? 'border-zinc-950 bg-white shadow-md ring-2 ring-zinc-950/10 dark:border-white dark:ring-white/20'
                                    : playing
                                      ? 'border-zinc-400 bg-white ring-1 ring-zinc-950/10'
                                      : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                            )}
                        >
                            {locked ? <StyleOptionLockBadge /> : null}
                            <IntroStyleThumb
                                styleId={option.id}
                                active={selected}
                                playing={playing}
                                paper={palette.paper}
                                ink={palette.ink}
                                seal={palette.seal}
                                initials={initials}
                            />
                            <span className="mt-2.5 block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                {option.id === DEFAULT_INTRO_STYLE && optionsLocked
                                    ? `Default · ${option.label}`
                                    : option.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                                {locked ? 'Preview above · unlock to use on your site' : option.description}
                            </span>
                            {locked ? (
                                <span
                                    role="link"
                                    tabIndex={0}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        goToUpgrade(upgradeUrl);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            goToUpgrade(upgradeUrl);
                                        }
                                    }}
                                    className="mt-2 inline-flex text-[11px] font-semibold text-amber-900 underline-offset-2 hover:underline"
                                >
                                    Unlock with a site pack →
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function TimerStylePanel({
    timerStyle,
    weddingDate,
    weddingTime,
    timezone,
    groom,
    bride,
    host,
    occasion,
    onChange,
    sections,
    details,
    onSectionsChange,
    onDetailsChange,
    optionsLocked = false,
    upgradeUrl,
}: {
    timerStyle: string;
    weddingDate?: string | null;
    weddingTime?: string | null;
    timezone?: string | null;
    groom?: string | null;
    bride?: string | null;
    host?: string | null;
    occasion?: string | null;
    onChange: (next: string) => void;
    sections?: Record<string, boolean>;
    details?: Record<string, string>;
    onSectionsChange?: (next: Record<string, boolean>) => void;
    onDetailsChange?: (next: Record<string, string>) => void;
    optionsLocked?: boolean;
    upgradeUrl?: string | null;
}) {
    const countdownEnabled = isSiteSectionEnabled(sections, 'countdown');
    const countdownNote = sectionNoteFromDetails(details, 'countdown');
    const countdownNoteKeys = SECTION_NOTE_DETAIL_KEYS.countdown;
    const birthday = isBirthdayOccasion(occasion);
    const corporate = isCorporateOccasion(occasion);
    const babyShower = isBabyShowerOccasion(occasion);
    const eventPack = !birthday && !corporate && !babyShower ? resolveEventCountdownPack(occasion) : null;
    const customPack = resolveCustomCountdownPack();
    const showCustomAccordion = eventPack?.id !== 'custom';
    const customStyleSelected = isCustomCountdownStyle(timerStyle);
    const [customOpen, setCustomOpen] = useState(customStyleSelected);

    useEffect(() => {
        if (customStyleSelected) {
            setCustomOpen(true);
        }
    }, [customStyleSelected]);

    const activeWeddingId = resolveCountdownTimerStyleId(timerStyle);
    const activeBirthdayId = resolveBirthdayCountdownStyleId(timerStyle);
    const activeCorporateId = resolveCorporateCountdownStyleId(timerStyle);
    const activeBabyShowerId = resolveBabyShowerCountdownStyleId(timerStyle);
    const activeEventId = eventPack ? resolveEventCountdownStyleId(eventPack, timerStyle) : '';
    const activeCustomId = resolveEventCountdownStyleId(customPack, timerStyle);
    const target = useMemo(
        () => resolveCountdownDate(weddingDate || '', Boolean(weddingDate)),
        [weddingDate],
    );
    const defaultClock = eventPack?.defaultClock
        || (birthday ? '20:00' : babyShower ? '11:00' : corporate ? '10:00' : '16:00');
    const countdown = useCountdown(
        target,
        resolveCountdownClock(weddingTime, defaultClock),
        timezone || 'America/New_York',
    );

    const allOptions = babyShower
        ? BABY_SHOWER_COUNTDOWN_STYLE_OPTIONS
        : corporate
          ? CORPORATE_COUNTDOWN_STYLE_OPTIONS
          : birthday
            ? BIRTHDAY_COUNTDOWN_STYLE_OPTIONS
            : eventPack
              ? eventPack.options
              : COUNTDOWN_TIMER_STYLE_OPTIONS;
    const defaultTimerId = babyShower
        ? DEFAULT_BABY_SHOWER_COUNTDOWN_STYLE
        : corporate
          ? DEFAULT_CORPORATE_COUNTDOWN_STYLE
          : birthday
            ? DEFAULT_BIRTHDAY_COUNTDOWN_STYLE
            : eventPack
              ? (eventPack.options[0]?.id ?? DEFAULT_COUNTDOWN_TIMER_STYLE)
              : DEFAULT_COUNTDOWN_TIMER_STYLE;
    const lockedDefault = allOptions.find((option) => option.id === defaultTimerId) ?? allOptions[0];
    const options = allOptions;

    useEffect(() => {
        if (!optionsLocked || !lockedDefault) {
            return;
        }
        if (timerStyle !== lockedDefault.id) {
            onChange(lockedDefault.id);
        }
    }, [optionsLocked, lockedDefault?.id, timerStyle, onChange]);

    const notice = babyShower
        ? 'Ten elevated baby-shower countdowns with unique pastel cartoons — parent, friend, and stork characters animate as the day gets closer.'
        : corporate
          ? 'Ten elevated corporate countdowns with unique summit cartoons — presenter, colleague, and host characters move as the event nears.'
          : birthday
            ? 'Ten elevated birthday countdowns with unique party cartoons — they walk, bounce, and gather as the day gets closer. Pick one and the live preview updates instantly.'
            : eventPack
              ? eventPack.notice
              : 'Ten modern cartoon countdowns. Pick one and the live preview updates instantly — couple characters move as the wedding day gets closer.';

    const swatchBg = eventPack?.swatchBg
        || (babyShower ? 'bg-[#fff7fb]' : corporate ? 'bg-[#f3fafc]' : birthday ? 'bg-[#fff7fa]' : 'bg-[#faf7f3]');
    const accent = eventPack?.accent
        || (babyShower ? '#d4849a' : corporate ? '#1f6f8b' : birthday ? '#c43b5a' : '#a67068');

    function renderOccasionPreview(styleId: string) {
        if (babyShower) {
            return (
                <BabyShowerCountdownTimer
                    styleId={styleId}
                    countdown={countdown}
                    host={host || 'Baby Shower'}
                    compact
                />
            );
        }
        if (corporate) {
            return (
                <CorporateCountdownTimer
                    styleId={styleId}
                    countdown={countdown}
                    host={host || 'Summit'}
                    compact
                />
            );
        }
        if (birthday) {
            return (
                <BirthdayCountdownTimer
                    styleId={styleId}
                    countdown={countdown}
                    host={host || 'Birthday'}
                    compact
                />
            );
        }
        if (eventPack) {
            return (
                <EventCountdownTimer
                    pack={eventPack}
                    styleId={styleId}
                    countdown={countdown}
                    host={host || eventPack.hostFallback}
                    compact
                />
            );
        }
        return (
            <CountdownTimer
                styleId={styleId}
                countdown={countdown}
                groom={groom || 'Groom'}
                bride={bride || 'Bride'}
                compact
            />
        );
    }

    function isOccasionOptionSelected(optionId: string): boolean {
        if (customStyleSelected) {
            return false;
        }
        if (babyShower) {
            return activeBabyShowerId === optionId;
        }
        if (corporate) {
            return activeCorporateId === optionId;
        }
        if (birthday) {
            return activeBirthdayId === optionId;
        }
        if (eventPack) {
            return activeEventId === optionId;
        }
        return activeWeddingId === optionId;
    }

    return (
        <div className="mt-4 space-y-4">
            {sections && details && onSectionsChange && onDetailsChange ? (
                <SectionEnableControl
                    sectionKey="countdown"
                    enabled={countdownEnabled}
                    note={countdownNote}
                    onEnabledChange={(enabled) => onSectionsChange({ ...sections, countdown: enabled })}
                    onNoteChange={(note) =>
                        onDetailsChange({
                            ...details,
                            [countdownNoteKeys.title]: note.title,
                            [countdownNoteKeys.body]: note.body,
                        })
                    }
                />
            ) : null}
            <PremiumDefaultOptionsNotice
                locked={optionsLocked}
                upgradeUrl={upgradeUrl}
                noun="countdown designs"
            />
            <EditorNotice>{notice}</EditorNotice>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {options.map((option) => {
                    const selected = isOccasionOptionSelected(option.id);
                    const locked = Boolean(optionsLocked && lockedDefault && option.id !== lockedDefault.id);

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                if (locked) {
                                    goToUpgrade(upgradeUrl);
                                    return;
                                }
                                onChange(option.id);
                            }}
                            className={cn(
                                'relative rounded-2xl border p-3 text-left transition',
                                selected
                                    ? 'border-zinc-950 bg-white shadow-md ring-2 ring-zinc-950/10 dark:border-white dark:ring-white/20'
                                    : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                locked && 'opacity-90',
                            )}
                        >
                            {locked ? <StyleOptionLockBadge /> : null}
                            <div
                                className={cn(
                                    'countdown-style-swatch min-h-[12rem] overflow-x-auto overflow-y-visible rounded-xl px-2 py-3 text-[#2b241c] sm:min-h-[11rem] sm:px-2.5',
                                    swatchBg,
                                    locked && 'opacity-70',
                                )}
                                style={
                                    {
                                        '--w-accent': accent,
                                        '--w-muted': '#8a7d72',
                                        '--w-ink': '#2b241c',
                                        '--w-surface': '#fffaf8',
                                    } as CSSProperties
                                }
                            >
                                <div className="countdown-style-swatch__inner mx-auto w-full max-w-full">
                                    {renderOccasionPreview(option.id)}
                                </div>
                            </div>
                            <span className="mt-2.5 block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                {lockedDefault && option.id === lockedDefault.id && optionsLocked
                                    ? `Default · ${option.label}`
                                    : option.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                                {locked ? 'Unlock with a site pack' : option.description}
                            </span>
                        </button>
                    );
                })}
            </div>

            {showCustomAccordion ? (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-950/10 dark:border-white/10">
                    {optionsLocked ? <StyleOptionLockBadge /> : null}
                    <button
                        type="button"
                        onClick={() => {
                            if (optionsLocked) {
                                goToUpgrade(upgradeUrl);
                                return;
                            }
                            setCustomOpen((open) => !open);
                        }}
                        aria-expanded={optionsLocked ? false : customOpen}
                        className="flex w-full items-center justify-between gap-3 bg-zinc-50/90 px-4 py-3 text-left transition hover:bg-zinc-100/90 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
                    >
                        <span>
                            <span className="block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                Custom designs
                            </span>
                            <span className="mt-0.5 block text-[11px] text-zinc-500">
                                {optionsLocked
                                    ? 'Unlock with a site pack'
                                    : `${customPack.options.length} unique cartoon countdowns — tap to ${customOpen ? 'close' : 'open'}`}
                            </span>
                        </span>
                        <ChevronDown
                            className={cn(
                                'h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300',
                                !optionsLocked && customOpen && 'rotate-180',
                            )}
                        />
                    </button>
                    <div
                        className={cn(
                            'grid transition-[grid-template-rows] duration-300 ease-out',
                            customOpen && !optionsLocked ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                    >
                        <div className="min-h-0 overflow-hidden">
                            <div className="border-t border-zinc-950/8 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-950/30">
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    {customPack.options.map((option) => {
                                        const selected = customStyleSelected && activeCustomId === option.id;

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => {
                                                    if (optionsLocked) {
                                                        goToUpgrade(upgradeUrl);
                                                        return;
                                                    }
                                                    onChange(option.id);
                                                }}
                                                className={cn(
                                                    'relative rounded-2xl border p-3 text-left transition',
                                                    selected
                                                        ? 'border-zinc-950 bg-white shadow-md ring-2 ring-zinc-950/10 dark:border-white dark:ring-white/20'
                                                        : 'border-zinc-950/8 bg-white/80 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                                )}
                                            >
                                                <div
                                                    className="countdown-style-swatch min-h-[12rem] overflow-x-auto overflow-y-visible rounded-xl bg-[#f0f9ff] px-2 py-3 text-[#2b241c] sm:min-h-[11rem] sm:px-2.5"
                                                    style={
                                                        {
                                                            '--w-accent': customPack.accent,
                                                            '--w-muted': '#8a7d72',
                                                            '--w-ink': '#2b241c',
                                                            '--w-surface': '#fffaf8',
                                                        } as CSSProperties
                                                    }
                                                >
                                                    <div className="countdown-style-swatch__inner mx-auto w-full max-w-full">
                                                        <EventCountdownTimer
                                                            pack={customPack}
                                                            styleId={option.id}
                                                            countdown={countdown}
                                                            host={host || customPack.hostFallback}
                                                            compact
                                                        />
                                                    </div>
                                                </div>
                                                <span className="mt-2.5 block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                                    {option.label}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                                                    {option.description}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function SiteBackgroundPanel({
    siteBgId,
    siteBg,
    siteSurface,
    onChange,
    optionsLocked = false,
    upgradeUrl,
}: {
    siteBgId: string;
    siteBg: string;
    siteSurface: string;
    onChange: (next: { site_bg_id: string; site_bg: string; site_surface: string }) => void;
    optionsLocked?: boolean;
    upgradeUrl?: string | null;
}) {
    const activeId = (siteBgId || '').trim() || (siteBg ? '' : 'template');

    useEffect(() => {
        if (optionsLocked && (siteBgId || siteBg || siteSurface)) {
            onChange({ site_bg_id: '', site_bg: '', site_surface: '' });
        }
    }, [optionsLocked, siteBgId, siteBg, siteSurface, onChange]);

    return (
        <div className="mt-4 space-y-4">
            <PremiumDefaultOptionsNotice
                locked={optionsLocked}
                upgradeUrl={upgradeUrl}
                noun="background colors"
            />
            <EditorNotice>
                Soft page colors for every event website. Text and accent colors auto-adjust so content
                stays solid and readable on the new background — nothing washed out or hidden.
            </EditorNotice>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {SITE_BACKGROUND_OPTIONS.map((option) => {
                    const selected =
                        option.id === 'template'
                            ? activeId === 'template' || (!siteBgId && !siteBg)
                            : activeId === option.id || siteBg === option.bg;
                    const swatch = option.id === 'template' ? 'transparent' : option.bg;
                    const locked = optionsLocked && option.id !== 'template';

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                if (locked) {
                                    goToUpgrade(upgradeUrl);
                                    return;
                                }
                                onChange(
                                    option.id === 'template'
                                        ? { site_bg_id: '', site_bg: '', site_surface: '' }
                                        : {
                                              site_bg_id: option.id,
                                              site_bg: option.bg,
                                              site_surface: option.surface,
                                          },
                                );
                            }}
                            className={cn(
                                'relative rounded-2xl border p-3 text-left transition',
                                selected
                                    ? 'border-zinc-950 bg-white shadow-md ring-2 ring-zinc-950/10 dark:border-white dark:ring-white/20'
                                    : 'border-zinc-950/8 bg-white/70 hover:border-zinc-950/15 dark:border-white/10 dark:bg-zinc-950/40',
                                locked && 'opacity-90',
                            )}
                        >
                            {locked ? <StyleOptionLockBadge /> : null}
                            <span
                                className={cn(
                                    'block h-12 w-full rounded-xl ring-1 ring-zinc-950/10',
                                    locked && 'opacity-70',
                                    option.id === 'template' &&
                                        'bg-[linear-gradient(135deg,#fafafa_0%,#f4f4f5_45%,#eef2f0_100%)] dark:bg-[linear-gradient(135deg,#18181b_0%,#111113_100%)]',
                                )}
                                style={option.id === 'template' ? undefined : { backgroundColor: swatch }}
                                aria-hidden
                            />
                            <span className="mt-2.5 block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                                {option.id === 'template' && optionsLocked
                                    ? `Default · ${option.label}`
                                    : option.label}
                            </span>
                            {locked ? (
                                <span className="mt-0.5 block text-[11px] text-zinc-500">Unlock with a site pack</span>
                            ) : option.id !== 'template' ? (
                                <span className="mt-0.5 block font-mono text-[10px] tracking-wide text-zinc-400 uppercase">
                                    {option.bg}
                                </span>
                            ) : (
                                <span className="mt-0.5 block text-[11px] text-zinc-500">Use the template look</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export { syncDetailsFromModel } from '@/lib/template-preview-model';
