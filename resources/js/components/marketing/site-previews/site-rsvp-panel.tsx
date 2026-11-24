import { useForm } from '@inertiajs/react';
import { Check, Heart, HelpCircle, PartyPopper, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';
import { inviteActionPath } from '@/lib/invite-actions';
import { cn } from '@/lib/utils';
import type { WeddingPage } from '@/types/wedding';

/**
 * Product RSVP sheet:
 * - Live event (has slug) → posts to /invite/{slug}/rsvp (or guest token route)
 * - Marketing / editor sample → local thank-you only
 */
export function SiteRsvpPanel({
    open,
    onClose,
    wedding = null,
    fillBtn,
    outlineBtn,
    desktop = false,
    framed: _framed = true,
    overlayClassName,
}: {
    open: boolean;
    onClose: () => void;
    wedding?: WeddingPage | null;
    fillBtn: string;
    outlineBtn?: string;
    desktop?: boolean;
    framed?: boolean;
    overlayClassName?: string;
}) {
    void _framed;
    const ui = useInvitationCopy();
    const [sampleSent, setSampleSent] = useState(false);
    const [entered, setEntered] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const live = Boolean(wedding?.slug);

    useBodyScrollLock(open);

    useEffect(() => {
        if (!open) {
            setEntered(false);
            setSampleSent(false);
            return;
        }

        const frame = window.requestAnimationFrame(() => setEntered(true));
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSampleSent(false);
                onClose();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !entered) {
            return;
        }
        const first = panelRef.current?.querySelector<HTMLElement>(
            'input:not([type="hidden"]), textarea, button:not([aria-label="Close RSVP"])',
        );
        first?.focus();
    }, [open, entered, sampleSent, live]);

    if (!open) {
        return null;
    }

    function handleClose(): void {
        setSampleSent(false);
        onClose();
    }

    return (
        <div
            role="presentation"
            className={cn(
                'site-rsvp-overlay z-40',
                desktop && 'is-desktop',
                entered && 'is-in',
                overlayClassName,
            )}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="site-rsvp-overlay__veil" aria-hidden />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn('site-rsvp-sheet', entered && 'is-in')}
            >
                <div className="site-rsvp-sheet__handle" aria-hidden />

                <div className="site-rsvp-sheet__body">
                    <div className="site-rsvp-sheet__top">
                        <div className="site-rsvp-sheet__heading">
                            <p className="site-rsvp-kicker">{ui.yourReply}</p>
                            <h2 id={titleId} className="site-rsvp-title">
                                {ui.sendRsvp}
                            </h2>
                            <p className="site-rsvp-lead">{ui.willYouJoin}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label={ui.sendRsvp}
                            className="site-rsvp-close"
                        >
                            <X className="size-4" strokeWidth={2.25} />
                        </button>
                    </div>

                    {live && wedding ? (
                        <LiveRsvpForm
                            wedding={wedding}
                            fillBtn={fillBtn}
                            outlineBtn={outlineBtn}
                            onClose={handleClose}
                        />
                    ) : sampleSent ? (
                        <RsvpSuccess
                            title={ui.thankYou}
                            body="Your sample reply is recorded. Customize this site to collect real responses."
                            onClose={handleClose}
                            outlineBtn={outlineBtn}
                            fillBtn={fillBtn}
                        />
                    ) : (
                        <SampleRsvpForm
                            fillBtn={fillBtn}
                            onSent={() => setSampleSent(true)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function RsvpField({
    label,
    error,
    children,
}: {
    label: string;
    error?: string | null;
    children: ReactNode;
}) {
    return (
        <label className={cn('site-rsvp-field', error && 'is-invalid')}>
            <span className="site-rsvp-label">{label}</span>
            {children}
            {error ? (
                <span className="site-rsvp-field__error" role="alert">
                    {error}
                </span>
            ) : null}
        </label>
    );
}

function SampleRsvpForm({
    fillBtn,
    onSent,
}: {
    fillBtn: string;
    onSent: () => void;
}) {
    const ui = useInvitationCopy();
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    return (
        <form
            className="site-rsvp-form"
            noValidate
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const trimmed = name.trim();
                if (!trimmed) {
                    setError(ui.yourName);
                    return;
                }
                setError(null);
                onSent();
            }}
        >
            <RsvpField label={ui.yourName} error={error}>
                <input
                    name="name"
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value);
                        if (error) {
                            setError(null);
                        }
                    }}
                    className={cn('site-rsvp-input', error && 'is-invalid')}
                    placeholder={ui.yourName}
                    aria-invalid={error ? true : undefined}
                />
            </RsvpField>
            <button type="submit" className={cn('site-rsvp-submit', fillBtn)}>
                <PartyPopper className="size-4" aria-hidden />
                {ui.sendSampleRsvp}
            </button>
        </form>
    );
}

function LiveRsvpDeadlineNote({ deadline }: { deadline: string | null }) {
    if (!deadline) {
        return null;
    }
    return (
        <p className="site-rsvp-lead" style={{ marginTop: '-0.25rem', marginBottom: '0.75rem' }}>
            Please reply by {deadline}.
        </p>
    );
}

function RsvpSuccess({
    title,
    body,
    onClose,
    fillBtn,
    outlineBtn,
}: {
    title: string;
    body: string;
    onClose: () => void;
    fillBtn: string;
    outlineBtn?: string;
}) {
    return (
        <div className="site-rsvp-success">
            <div className="site-rsvp-success__icon">
                <Check className="size-6 stroke-[2.5]" aria-hidden />
            </div>
            <p className="site-rsvp-success__title">{title}</p>
            <p className="site-rsvp-success__body">{body}</p>
            <button
                type="button"
                onClick={onClose}
                className={cn('site-rsvp-submit', outlineBtn || fillBtn)}
            >
                Close
            </button>
        </div>
    );
}

function LiveRsvpForm({
    wedding,
    fillBtn,
    outlineBtn,
    onClose,
}: {
    wedding: WeddingPage;
    fillBtn: string;
    outlineBtn?: string;
    onClose: () => void;
}) {
    const ui = useInvitationCopy();
    const [sent, setSent] = useState(false);
    const [localErrors, setLocalErrors] = useState<Partial<Record<'guest_name' | 'email' | 'guest_count', string>>>(
        {},
    );
    const fields = wedding.rsvp_fields ?? ['attend', 'schedule', 'party_size', 'meal', 'note'];
    const wants = (field: string) => fields.includes(field);
    const form = useForm({
        guest_name: wedding.guest?.name ?? '',
        email: wedding.guest?.email ?? '',
        status: 'attending',
        guest_count: wedding.guest?.number_of_guests ?? 1,
        meal_preference: 'no_preference',
        dietary_restrictions: '',
        message: '',
        company: '',
        job_title: '',
        events: Object.fromEntries(
            (wedding.events ?? []).map((event) => [String(event.id), true]),
        ) as Record<string, boolean>,
    });

    const action = wedding.guest
        ? inviteActionPath(wedding, `g/${wedding.guest.token}/rsvp`)
        : inviteActionPath(wedding, 'rsvp');
    const meals = wedding.options?.meals ?? {
        no_preference: 'No preference',
        vegetarian: 'Vegetarian',
        non_vegetarian: 'Non-vegetarian',
        vegan: 'Vegan',
        jain: 'Jain',
        other: 'Other',
    };

    function clearFieldError(field: 'guest_name' | 'email' | 'guest_count'): void {
        setLocalErrors((current) => {
            if (!current[field]) {
                return current;
            }
            const next = { ...current };
            delete next[field];
            return next;
        });
        if (form.errors[field]) {
            form.clearErrors(field);
        }
    }

    function validate(): boolean {
        const next: Partial<Record<'guest_name' | 'email' | 'guest_count', string>> = {};
        const name = form.data.guest_name.trim();
        const email = form.data.email.trim();

        if (!name) {
            next.guest_name = 'Please enter your name.';
        }
        if (!email) {
            next.email = 'Please enter your email.';
        } else if (!isValidEmail(email)) {
            next.email = 'Please enter a valid email address.';
        }
        if (form.data.status === 'attending' && wants('party_size')) {
            const count = Number(form.data.guest_count);
            if (!Number.isFinite(count) || count < 1) {
                next.guest_count = 'Party size must be at least 1.';
            } else if (count > 20) {
                next.guest_count = 'Party size can be at most 20.';
            }
        }

        setLocalErrors(next);
        return Object.keys(next).length === 0;
    }

    const windowState = wedding.rsvp_window;
    const deadlineLabel = windowState?.deadline
        ? new Date(`${windowState.deadline}T12:00:00`).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : null;
    const softClosed = Boolean(windowState?.closed && (windowState?.soft_close ?? true));

    if (sent) {
        return (
            <RsvpSuccess
                title={ui.onTheList}
                body="Your reply has been sent to the hosts. We can't wait to celebrate with you."
                onClose={onClose}
                fillBtn={fillBtn}
                outlineBtn={outlineBtn}
            />
        );
    }

    if (softClosed) {
        return (
            <RsvpSuccess
                title="RSVPs are closed"
                body={
                    deadlineLabel
                        ? `Replies closed on ${deadlineLabel}. Please contact the hosts if you need to update your response.`
                        : 'Replies are no longer being accepted online. Please contact the hosts directly.'
                }
                onClose={onClose}
                fillBtn={fillBtn}
                outlineBtn={outlineBtn}
            />
        );
    }

    const statusOptions = [
        {
            value: 'attending' as const,
            label: ui.attending,
            hint: ui.yes,
            icon: PartyPopper,
        },
        {
            value: 'not_attending' as const,
            label: ui.declining,
            hint: ui.no,
            icon: Heart,
        },
        {
            value: 'maybe' as const,
            label: ui.stillDeciding,
            hint: ui.maybe,
            icon: HelpCircle,
        },
    ];

    const nameError = localErrors.guest_name || form.errors.guest_name || null;
    const emailError = localErrors.email || form.errors.email || null;
    const countError = localErrors.guest_count || form.errors.guest_count || null;
    const otherError =
        Object.entries(form.errors).find(
            ([key]) => key !== 'guest_name' && key !== 'email' && key !== 'guest_count',
        )?.[1] || null;

    return (
        <form
            className="site-rsvp-form"
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                if (!validate()) {
                    return;
                }
                form.post(action, {
                    preserveScroll: true,
                    onSuccess: () => setSent(true),
                });
            }}
        >
            <LiveRsvpDeadlineNote deadline={deadlineLabel} />
            <fieldset className="site-rsvp-status-group">
                <legend className="site-rsvp-label">Will you join?</legend>
                {statusOptions.map((option) => {
                    const Icon = option.icon;
                    const active = form.data.status === option.value;
                    return (
                        <label
                            key={option.value}
                            className={cn('site-rsvp-status', active && 'is-active')}
                        >
                            <input
                                type="radio"
                                name="status"
                                value={option.value}
                                checked={active}
                                onChange={() => {
                                    form.setData('status', option.value);
                                    clearFieldError('guest_count');
                                }}
                                className="sr-only"
                            />
                            <span className="site-rsvp-status__icon" aria-hidden>
                                <Icon className="size-3.5" />
                            </span>
                            <span className="site-rsvp-status__copy">
                                <span className="site-rsvp-status__label">{option.label}</span>
                                <span className="site-rsvp-status__hint">{option.hint}</span>
                            </span>
                            <span className={cn('site-rsvp-status__check', active && 'is-on')} aria-hidden>
                                <Check className="size-3 stroke-[2.5]" />
                            </span>
                        </label>
                    );
                })}
            </fieldset>

            <RsvpField label={ui.yourName} error={nameError}>
                <input
                    value={form.data.guest_name}
                    onChange={(event) => {
                        form.setData('guest_name', event.target.value);
                        clearFieldError('guest_name');
                    }}
                    className={cn('site-rsvp-input', nameError && 'is-invalid')}
                    placeholder={ui.yourName}
                    autoComplete="name"
                    aria-invalid={nameError ? true : undefined}
                />
            </RsvpField>
            <RsvpField label="Email" error={emailError}>
                <input
                    type="email"
                    value={form.data.email}
                    onChange={(event) => {
                        form.setData('email', event.target.value);
                        clearFieldError('email');
                    }}
                    className={cn('site-rsvp-input', emailError && 'is-invalid')}
                    placeholder="you@email.com"
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={emailError ? true : undefined}
                />
            </RsvpField>
            {form.data.status === 'attending' ? (
                <>
                    {wants('party_size') ? (
                        <RsvpField label={ui.guests} error={countError}>
                            <div className={cn('site-rsvp-stepper', countError && 'is-invalid')}>
                                <button
                                    type="button"
                                    aria-label="Decrease party size"
                                    className="site-rsvp-stepper__btn"
                                    onClick={() => {
                                        form.setData('guest_count', Math.max(1, Number(form.data.guest_count) - 1));
                                        clearFieldError('guest_count');
                                    }}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={form.data.guest_count}
                                    onChange={(event) => {
                                        form.setData('guest_count', Number(event.target.value) || 1);
                                        clearFieldError('guest_count');
                                    }}
                                    className="site-rsvp-stepper__value"
                                    aria-invalid={countError ? true : undefined}
                                />
                                <button
                                    type="button"
                                    aria-label="Increase party size"
                                    className="site-rsvp-stepper__btn"
                                    onClick={() => {
                                        form.setData('guest_count', Math.min(20, Number(form.data.guest_count) + 1));
                                        clearFieldError('guest_count');
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </RsvpField>
                    ) : null}
                    {wants('meal') ? (
                        <RsvpField label={ui.meal}>
                            <select
                                value={form.data.meal_preference}
                                onChange={(event) => form.setData('meal_preference', event.target.value)}
                                className="site-rsvp-input"
                            >
                                {Object.entries(meals).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </RsvpField>
                    ) : null}
                    {wants('schedule') && (wedding.events?.length ?? 0) > 0 ? (
                        <fieldset className="site-rsvp-events">
                            <legend className="site-rsvp-label">{ui.events}</legend>
                            <div className="site-rsvp-events__list">
                                {wedding.events.map((event) => (
                                    <label key={event.id} className="site-rsvp-events__item">
                                        <input
                                            type="checkbox"
                                            checked={form.data.events[String(event.id)] ?? false}
                                            onChange={(input) =>
                                                form.setData('events', {
                                                    ...form.data.events,
                                                    [String(event.id)]: input.target.checked,
                                                })
                                            }
                                        />
                                        <span>{event.title}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    ) : null}
                    {wants('company') ? (
                        <RsvpField label="Company">
                            <input
                                value={form.data.company}
                                onChange={(event) => form.setData('company', event.target.value)}
                                className="site-rsvp-input"
                                placeholder="Company"
                            />
                        </RsvpField>
                    ) : null}
                    {wants('job_title') ? (
                        <RsvpField label="Job title">
                            <input
                                value={form.data.job_title}
                                onChange={(event) => form.setData('job_title', event.target.value)}
                                className="site-rsvp-input"
                                placeholder="Job title"
                            />
                        </RsvpField>
                    ) : null}
                </>
            ) : null}
            {wants('dietary') ? (
                <RsvpField label={ui.dietary}>
                    <input
                        value={form.data.dietary_restrictions}
                        onChange={(event) => form.setData('dietary_restrictions', event.target.value)}
                        className="site-rsvp-input"
                        placeholder={ui.dietary}
                    />
                </RsvpField>
            ) : null}
            {wants('note') || wants('message') ? (
                <RsvpField label={ui.message}>
                    <textarea
                        value={form.data.message}
                        onChange={(event) => form.setData('message', event.target.value)}
                        rows={3}
                        className="site-rsvp-input site-rsvp-input--area"
                        placeholder={ui.message}
                    />
                </RsvpField>
            ) : null}
            {otherError ? <p className="site-rsvp-error">{otherError}</p> : null}
            <button
                type="submit"
                disabled={form.processing}
                className={cn('site-rsvp-submit disabled:opacity-60', fillBtn)}
            >
                {form.processing ? (
                    'Sending…'
                ) : (
                    <>
                        <PartyPopper className="size-4" aria-hidden />
                        {ui.confirmRsvp}
                    </>
                )}
            </button>
        </form>
    );
}
