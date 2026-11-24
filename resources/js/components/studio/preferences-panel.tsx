import { Bell, Globe2, Languages, Loader2, Send, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';
import {
    EditorField,
    EditorNotice,
    EditorSelect,
    EditorTextArea,
    EditorTextInput,
} from '@/components/studio/editor-fields';
import { StudioToggle } from '@/components/studio/studio-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function inviteDeliveryMode(
    details: Record<string, string | null | undefined> | null | undefined,
): 'manual' | 'automated' {
    return details?.invite_delivery_mode === 'automated' ? 'automated' : 'manual';
}

export function isCelebrateEnabled(details: Record<string, string> | null | undefined): boolean {
    const raw = (details?.celebrate_enabled ?? '').trim().toLowerCase();
    if (!raw) {
        return true;
    }
    return raw !== '0' && raw !== 'false' && raw !== 'off';
}

export function isRsvpRemindersEnabled(
    details: Record<string, string | null | undefined> | null | undefined,
): boolean {
    const raw = (details?.rsvp_reminders_enabled ?? '').trim().toLowerCase();
    if (!raw) {
        return false;
    }
    return raw !== '0' && raw !== 'false' && raw !== 'off';
}

export function isRsvpThankYouEnabled(
    details: Record<string, string | null | undefined> | null | undefined,
): boolean {
    const raw = (details?.rsvp_thank_you_enabled ?? '').trim().toLowerCase();
    if (!raw) {
        return false;
    }
    return raw !== '0' && raw !== 'false' && raw !== 'off';
}

export function isRsvpSoftCloseEnabled(
    details: Record<string, string | null | undefined> | null | undefined,
): boolean {
    const raw = (details?.rsvp_soft_close ?? '1').trim().toLowerCase();
    return raw !== '0' && raw !== 'false' && raw !== 'off';
}

export function isPhotoWallEnabled(
    details: Record<string, string | null | undefined> | null | undefined,
): boolean {
    const raw = (details?.photo_wall_enabled ?? '').trim().toLowerCase();
    if (!raw) {
        return false;
    }
    return raw !== '0' && raw !== 'false' && raw !== 'off';
}

/** @deprecated Prefer importing from `@/components/studio/security-panel`. */
export { isSitePasscodeEnabled } from '@/components/studio/security-panel';

type LocaleOption = { name: string; native: string };

export type TranslationSourceContent = {
    bride_display_name?: string;
    groom_display_name?: string;
    headline?: string;
    hero_message?: string;
    story_eyebrow?: string;
    story_heading?: string;
    story?: string;
    host_message?: string;
    gallery_eyebrow?: string;
    gallery_title?: string;
    gallery_intro?: string;
    guests_intro?: string;
    event_line?: string;
};

export function PreferencesPanel({
    eventId,
    celebrateEnabled,
    onCelebrateEnabledChange,
    inviteDeliveryModeValue = 'manual',
    onInviteDeliveryModeChange,
    rsvpRemindersEnabled,
    onRsvpRemindersEnabledChange,
    rsvpReminderCooldownDays = '3',
    onRsvpReminderCooldownDaysChange,
    rsvpReminderMax = '2',
    onRsvpReminderMaxChange,
    rsvpDeadline = '',
    onRsvpDeadlineChange,
    rsvpSoftClose = true,
    onRsvpSoftCloseChange,
    rsvpThankYouEnabled = false,
    onRsvpThankYouEnabledChange,
    photoWallEnabled = false,
    onPhotoWallEnabledChange,
    language,
    secondaryLanguage,
    culturalTemplate,
    translationLocale,
    translation,
    sourceContent,
    locales = {},
    cultures = {},
    onLanguageChange,
    onSecondaryLanguageChange,
    onCulturalTemplateChange,
    onTranslationLocaleChange,
    onTranslationChange,
}: {
    eventId: number;
    celebrateEnabled: boolean;
    onCelebrateEnabledChange: (enabled: boolean) => void;
    inviteDeliveryModeValue?: 'manual' | 'automated';
    onInviteDeliveryModeChange?: (mode: 'manual' | 'automated') => void;
    rsvpRemindersEnabled: boolean;
    onRsvpRemindersEnabledChange: (enabled: boolean) => void;
    rsvpReminderCooldownDays?: string;
    onRsvpReminderCooldownDaysChange?: (value: string) => void;
    rsvpReminderMax?: string;
    onRsvpReminderMaxChange?: (value: string) => void;
    rsvpDeadline?: string;
    onRsvpDeadlineChange?: (value: string) => void;
    rsvpSoftClose?: boolean;
    onRsvpSoftCloseChange?: (enabled: boolean) => void;
    rsvpThankYouEnabled?: boolean;
    onRsvpThankYouEnabledChange?: (enabled: boolean) => void;
    photoWallEnabled?: boolean;
    onPhotoWallEnabledChange?: (enabled: boolean) => void;
    language: string;
    secondaryLanguage: string;
    culturalTemplate: string;
    translationLocale: string;
    translation: Record<string, string>;
    sourceContent: TranslationSourceContent;
    locales?: Record<string, LocaleOption>;
    cultures?: Record<string, string>;
    onLanguageChange: (value: string) => void;
    onSecondaryLanguageChange: (value: string) => void;
    onCulturalTemplateChange: (value: string) => void;
    onTranslationLocaleChange: (value: string) => void;
    onTranslationChange: (next: Record<string, string>) => void;
}) {
    const localeEntries = Object.entries(locales);
    const cultureEntries = Object.entries(cultures);
    const secondaryActive = Boolean(secondaryLanguage.trim());
    const [translating, setTranslating] = useState(false);
    const [translateMessage, setTranslateMessage] = useState<string | null>(null);
    const [translateError, setTranslateError] = useState<string | null>(null);
    const targetMeta = locales[secondaryLanguage];

    async function autoTranslateAll(): Promise<void> {
        if (!secondaryLanguage || translating) {
            return;
        }

        setTranslating(true);
        setTranslateMessage(null);
        setTranslateError(null);

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const xsrf = document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')
                .slice(1)
                .join('=');

            const response = await fetch(`/events/${eventId}/translate-content`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                    ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    from: language || 'en',
                    to: secondaryLanguage,
                    fields: {
                        bride_display_name: sourceContent.bride_display_name || '',
                        groom_display_name: sourceContent.groom_display_name || '',
                        headline: sourceContent.headline || '',
                        hero_message: sourceContent.hero_message || '',
                        story_eyebrow: sourceContent.story_eyebrow || '',
                        story_heading: sourceContent.story_heading || '',
                        story: sourceContent.story || '',
                        host_message: sourceContent.host_message || '',
                        gallery_eyebrow: sourceContent.gallery_eyebrow || '',
                        gallery_title: sourceContent.gallery_title || '',
                        gallery_intro: sourceContent.gallery_intro || '',
                        guests_intro: sourceContent.guests_intro || '',
                        event_line: sourceContent.event_line || '',
                    },
                }),
            });

            const payload = (await response.json()) as {
                ok?: boolean;
                message?: string;
                fields?: Record<string, string>;
            };

            if (!response.ok || !payload.ok || !payload.fields) {
                setTranslateError(payload.message || 'Translation failed. Try again in a moment.');
                return;
            }

            onTranslationChange({ ...translation, ...payload.fields });
            onTranslationLocaleChange(secondaryLanguage);
            setTranslateMessage(
                payload.message ||
                    `Filled secondary copy in ${targetMeta?.native || secondaryLanguage}. Review, then Save.`,
            );
        } catch {
            setTranslateError('Could not reach the translator. Check your connection and try again.');
        } finally {
            setTranslating(false);
        }
    }

    return (
        <div className="mt-4 space-y-4">
            <EditorNotice>
                Guest-facing extras for the live invite. Save to apply — preview stays in sync as you edit.
            </EditorNotice>

            <section className="overflow-hidden rounded-[1.35rem] border border-zinc-950/8 bg-white shadow-[0_18px_40px_-28px_rgba(24,24,27,0.45)]">
                <div className="flex items-center gap-3 border-b border-zinc-950/5 bg-gradient-to-r from-amber-50/80 via-white to-rose-50/40 px-4 py-3.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-amber-200/70">
                        <img src="/images/celebrate-popper.png" alt="" className="h-6 w-6 object-contain" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold tracking-tight text-zinc-900">Celebrate moment</p>
                        <p className="text-[11px] leading-snug text-zinc-500">
                            A soft confetti burst from the guest site corner
                        </p>
                    </div>
                    {celebrateEnabled ? (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-900/80 uppercase">
                            <Sparkles className="size-3" />
                            Live
                        </span>
                    ) : null}
                </div>
                <div className="p-3">
                    <StudioToggle
                        checked={celebrateEnabled}
                        onCheckedChange={onCelebrateEnabledChange}
                        label="Show celebrate button"
                        description="Guests can tap the party cracker for a short confetti celebration."
                    />
                </div>
            </section>

            <section className="overflow-hidden rounded-[1.35rem] border border-zinc-950/8 bg-white shadow-[0_18px_40px_-28px_rgba(24,24,27,0.45)]">
                <div className="flex items-center gap-3 border-b border-zinc-950/5 bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/40 px-4 py-3.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-sky-200/70">
                        <Globe2 className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold tracking-tight text-zinc-900">Language & culture</p>
                        <p className="text-[11px] leading-snug text-zinc-500">
                            Primary language updates site UI immediately. Secondary appears on the live invite after publish.
                        </p>
                    </div>
                </div>
                <div className="space-y-3 p-4">
                    <EditorField label="Primary language">
                        <EditorSelect
                            value={language || 'en'}
                            onValueChange={onLanguageChange}
                            placeholder="Choose language"
                            options={localeEntries.map(([value, meta]) => ({
                                value,
                                label: `${meta.native} (${meta.name})`,
                            }))}
                        />
                    </EditorField>
                    <EditorField label="Secondary language">
                        <EditorSelect
                            value={secondaryLanguage || '__none__'}
                            onValueChange={(value) => {
                                const next = value === '__none__' ? '' : value;
                                onSecondaryLanguageChange(next);
                                // Drop stale secondary draft so Hindi (etc.) cannot be
                                // re-saved under a newly chosen language.
                                onTranslationChange({});
                                if (next) {
                                    onTranslationLocaleChange(next);
                                } else {
                                    onTranslationLocaleChange('');
                                }
                            }}
                            placeholder="Optional bilingual"
                            options={[
                                { value: '__none__', label: 'None (single language)' },
                                ...localeEntries
                                    .filter(([value]) => value !== language)
                                    .map(([value, meta]) => ({
                                        value,
                                        label: `${meta.native} (${meta.name})`,
                                    })),
                            ]}
                        />
                    </EditorField>
                    <EditorField label="Cultural template">
                        <EditorSelect
                            value={culturalTemplate || '__none__'}
                            onValueChange={(value) =>
                                onCulturalTemplateChange(value === '__none__' ? '' : value)
                            }
                            placeholder="Optional cultural tone"
                            options={[
                                { value: '__none__', label: 'Default' },
                                ...cultureEntries.map(([value, label]) => ({ value, label })),
                            ]}
                        />
                    </EditorField>
                </div>
            </section>

            {secondaryActive ? (
                <section className="overflow-hidden rounded-[1.35rem] border border-zinc-950/8 bg-white shadow-[0_18px_40px_-28px_rgba(24,24,27,0.45)]">
                    <div className="flex items-center gap-3 border-b border-zinc-950/5 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/30 px-4 py-3.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-200/70">
                            <Languages className="size-4.5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold tracking-tight text-zinc-900">
                                Secondary copy
                            </p>
                            <p className="text-[11px] leading-snug text-zinc-500">
                                Optional translated lines shown when guests switch language
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3 p-4">
                        <EditorField label="Translation locale">
                            <EditorSelect
                                value={translationLocale || secondaryLanguage}
                                onValueChange={onTranslationLocaleChange}
                                options={localeEntries
                                    .filter(
                                        ([value]) =>
                                            value === secondaryLanguage || value === translationLocale,
                                    )
                                    .map(([value, meta]) => ({
                                        value,
                                        label: `${meta.native} (${meta.name})`,
                                    }))}
                            />
                        </EditorField>
                        <EditorNotice>
                            Any language in the dropdown works for UI chrome + auto-translate.
                            Write in primary, then Save. On Publish we fill missing secondary lines —
                            or click <strong>Translate all content</strong> to review first. Guests
                            get the language switch on the live invite; the editor stays in primary.
                        </EditorNotice>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                disabled={translating}
                                onClick={() => void autoTranslateAll()}
                                className="h-10 rounded-full bg-zinc-950 px-4 text-white hover:bg-zinc-800"
                            >
                                {translating ? (
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                ) : (
                                    <Wand2 className="mr-1.5 size-3.5" />
                                )}
                                {translating
                                    ? 'Translating…'
                                    : `Translate all content → ${targetMeta?.native || secondaryLanguage}`}
                            </Button>
                            <p className="text-[11px] text-zinc-500">
                                Machine draft — edit anything that looks off.
                            </p>
                        </div>
                        {translateMessage ? (
                            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-800 ring-1 ring-emerald-200/70">
                                {translateMessage}
                            </p>
                        ) : null}
                        {translateError ? (
                            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700 ring-1 ring-rose-200/70">
                                {translateError}
                            </p>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <EditorField label="Bride display name">
                                <EditorTextInput
                                    value={translation.bride_display_name || ''}
                                    onChange={(event) =>
                                        onTranslationChange({
                                            ...translation,
                                            bride_display_name: event.target.value,
                                        })
                                    }
                                    placeholder="Translated name"
                                />
                            </EditorField>
                            <EditorField label="Groom display name">
                                <EditorTextInput
                                    value={translation.groom_display_name || ''}
                                    onChange={(event) =>
                                        onTranslationChange({
                                            ...translation,
                                            groom_display_name: event.target.value,
                                        })
                                    }
                                    placeholder="Translated name"
                                />
                            </EditorField>
                        </div>
                        <EditorField label="Headline / kicker">
                            <EditorTextInput
                                value={translation.headline || ''}
                                onChange={(event) =>
                                    onTranslationChange({ ...translation, headline: event.target.value })
                                }
                                placeholder="Translated headline"
                            />
                        </EditorField>
                        <EditorField label="Hero message">
                            <EditorTextArea
                                value={translation.hero_message || ''}
                                onChange={(event) =>
                                    onTranslationChange({
                                        ...translation,
                                        hero_message: event.target.value,
                                    })
                                }
                                placeholder="Main hero line guests see at the top"
                            />
                        </EditorField>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <EditorField label="Story eyebrow">
                                <EditorTextInput
                                    value={translation.story_eyebrow || ''}
                                    onChange={(event) =>
                                        onTranslationChange({
                                            ...translation,
                                            story_eyebrow: event.target.value,
                                        })
                                    }
                                    placeholder="e.g. Our story"
                                />
                            </EditorField>
                            <EditorField label="Story heading">
                                <EditorTextInput
                                    value={translation.story_heading || ''}
                                    onChange={(event) =>
                                        onTranslationChange({
                                            ...translation,
                                            story_heading: event.target.value,
                                        })
                                    }
                                    placeholder="Translated story title"
                                />
                            </EditorField>
                        </div>
                        <EditorField label="Story">
                            <EditorTextArea
                                value={translation.story || ''}
                                onChange={(event) =>
                                    onTranslationChange({ ...translation, story: event.target.value })
                                }
                                placeholder="Translated story body"
                            />
                        </EditorField>
                        <EditorField label="Host message">
                            <EditorTextArea
                                value={translation.host_message || ''}
                                onChange={(event) =>
                                    onTranslationChange({
                                        ...translation,
                                        host_message: event.target.value,
                                    })
                                }
                                placeholder="Short host note (also used as hero fallback)"
                            />
                        </EditorField>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <EditorField label="Gallery title">
                                <EditorTextInput
                                    value={translation.gallery_title || ''}
                                    onChange={(event) =>
                                        onTranslationChange({
                                            ...translation,
                                            gallery_title: event.target.value,
                                        })
                                    }
                                />
                            </EditorField>
                            <EditorField label="Gallery eyebrow">
                                <EditorTextInput
                                    value={translation.gallery_eyebrow || ''}
                                    onChange={(event) =>
                                        onTranslationChange({
                                            ...translation,
                                            gallery_eyebrow: event.target.value,
                                        })
                                    }
                                />
                            </EditorField>
                        </div>
                        <EditorField label="Gallery intro">
                            <EditorTextArea
                                value={translation.gallery_intro || ''}
                                onChange={(event) =>
                                    onTranslationChange({
                                        ...translation,
                                        gallery_intro: event.target.value,
                                    })
                                }
                            />
                        </EditorField>
                        <EditorField label="Guests intro">
                            <EditorTextArea
                                value={translation.guests_intro || ''}
                                onChange={(event) =>
                                    onTranslationChange({
                                        ...translation,
                                        guests_intro: event.target.value,
                                    })
                                }
                            />
                        </EditorField>
                        <EditorField label="Event line">
                            <EditorTextInput
                                value={translation.event_line || ''}
                                onChange={(event) =>
                                    onTranslationChange({
                                        ...translation,
                                        event_line: event.target.value,
                                    })
                                }
                            />
                        </EditorField>
                    </div>
                </section>
            ) : null}

            <section className="overflow-hidden rounded-[1.35rem] border border-zinc-950/8 bg-white shadow-[0_18px_40px_-28px_rgba(24,24,27,0.45)]">
                <div className="flex items-center gap-3 border-b border-zinc-950/5 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/40 px-4 py-3.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-200/70">
                        <Send className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold tracking-tight text-zinc-900">
                            Invite delivery
                        </p>
                        <p className="text-[11px] leading-snug text-zinc-500">
                            Default for Manage → Guests. Hosts can still switch per session there.
                        </p>
                    </div>
                </div>
                <div className="space-y-2 p-3">
                    <div className="relative grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100/90 p-1.5 ring-1 ring-zinc-950/5">
                        <span
                            aria-hidden
                            className={cn(
                                'pointer-events-none absolute top-1.5 bottom-1.5 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-[0_1px_0_rgba(24,24,27,0.04),0_8px_24px_-12px_rgba(24,24,27,0.35)] ring-1 ring-zinc-950/8 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                inviteDeliveryModeValue === 'automated'
                                    ? 'translate-x-[calc(100%+0.25rem)]'
                                    : 'translate-x-0',
                            )}
                            style={{ left: '0.375rem' }}
                        />
                        {(
                            [
                                {
                                    id: 'manual' as const,
                                    title: 'Free · your phone',
                                    detail: 'WhatsApp & SMS from your device. Email from the app.',
                                },
                                {
                                    id: 'automated' as const,
                                    title: 'Automated · Twilio',
                                    detail: 'Email, WhatsApp, and SMS sent in bulk from the app.',
                                },
                            ] as const
                        ).map((option) => {
                            const active = inviteDeliveryModeValue === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    data-ripple=""
                                    aria-pressed={active}
                                    onClick={() => onInviteDeliveryModeChange?.(option.id)}
                                    className={cn(
                                        'ui-ripple-host relative z-[1] overflow-hidden rounded-xl px-3.5 py-3 text-left transition-colors duration-300',
                                        active ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-800',
                                    )}
                                >
                                    <span className="relative z-[3] block">
                                        <span className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    'size-2 shrink-0 rounded-full transition duration-300',
                                                    active
                                                        ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]'
                                                        : 'bg-zinc-300',
                                                )}
                                            />
                                            <span className="text-[13px] font-semibold tracking-tight">
                                                {option.title}
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                'mt-1 block text-[11px] leading-snug transition-colors duration-300',
                                                active ? 'text-zinc-500' : 'text-zinc-400',
                                            )}
                                        >
                                            {option.detail}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-[1.35rem] border border-zinc-950/8 bg-white shadow-[0_18px_40px_-28px_rgba(24,24,27,0.45)]">
                <div className="flex items-center gap-3 border-b border-zinc-950/5 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/40 px-4 py-3.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200/70">
                        <Bell className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold tracking-tight text-zinc-900">RSVP reminders</p>
                        <p className="text-[11px] leading-snug text-zinc-500">
                            Email guests who have not replied yet
                        </p>
                    </div>
                </div>
                <div className="space-y-3 p-3">
                    <StudioToggle
                        checked={rsvpRemindersEnabled}
                        onCheckedChange={onRsvpRemindersEnabledChange}
                        label="Enable automatic reminders"
                        description="Daily emails (~09:00 server time) to pending invitees with an email on file. Manual sends from Manage → RSVP ignore cooldown."
                    />
                    {rsvpRemindersEnabled ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            <label className="grid gap-1 text-[12px]">
                                <span className="font-medium text-zinc-700">Cooldown between reminders</span>
                                <select
                                    value={rsvpReminderCooldownDays}
                                    onChange={(event) => onRsvpReminderCooldownDaysChange?.(event.target.value)}
                                    className="h-9 rounded-xl border border-zinc-200 bg-white px-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
                                >
                                    {[1, 2, 3, 5, 7].map((days) => (
                                        <option key={days} value={String(days)}>
                                            Every {days} day{days === 1 ? '' : 's'}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1 text-[12px]">
                                <span className="font-medium text-zinc-700">Max auto sends</span>
                                <select
                                    value={rsvpReminderMax}
                                    onChange={(event) => onRsvpReminderMaxChange?.(event.target.value)}
                                    className="h-9 rounded-xl border border-zinc-200 bg-white px-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
                                >
                                    {[1, 2, 3, 4].map((max) => (
                                        <option key={max} value={String(max)}>
                                            {max} reminder{max === 1 ? '' : 's'} max
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    ) : null}

                    <label className="grid gap-1 text-[12px]">
                        <span className="font-medium text-zinc-700">RSVP deadline (optional)</span>
                        <input
                            type="date"
                            value={rsvpDeadline}
                            onChange={(event) => onRsvpDeadlineChange?.(event.target.value)}
                            className="h-9 rounded-xl border border-zinc-200 bg-white px-2.5 text-sm dark:border-white/10 dark:bg-zinc-900"
                        />
                        <span className="text-[11px] text-zinc-500">
                            Guests see “reply by” on the invite. After this date, new RSVPs are blocked.
                        </span>
                    </label>
                    {rsvpDeadline ? (
                        <StudioToggle
                            checked={rsvpSoftClose}
                            onCheckedChange={(enabled) => onRsvpSoftCloseChange?.(enabled)}
                            label="Soft close message"
                            description="Show a friendly “RSVPs closed” panel instead of a bare error after the deadline."
                        />
                    ) : null}
                    <StudioToggle
                        checked={rsvpThankYouEnabled}
                        onCheckedChange={(enabled) => onRsvpThankYouEnabledChange?.(enabled)}
                        label="Thank-you email after RSVP"
                        description="Send guests a short confirmation when they reply (requires their email)."
                    />
                </div>
            </section>

            <section className="overflow-hidden rounded-[1.35rem] border border-zinc-950/8 bg-white shadow-[0_18px_40px_-28px_rgba(24,24,27,0.45)]">
                <div className="flex items-center gap-3 border-b border-zinc-950/5 bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/40 px-4 py-3.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-sky-200/70">
                        <Sparkles className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold tracking-tight text-zinc-900">Guest photo wall</p>
                        <p className="text-[11px] leading-snug text-zinc-500">
                            Guests upload photos; you approve before they go live
                        </p>
                    </div>
                </div>
                <div className="p-3">
                    <StudioToggle
                        checked={photoWallEnabled}
                        onCheckedChange={(enabled) => onPhotoWallEnabledChange?.(enabled)}
                        label="Enable guest photo uploads"
                        description="Adds a photo wall on the invitation and a moderation inbox on Manage."
                    />
                </div>
            </section>
        </div>
    );
}
