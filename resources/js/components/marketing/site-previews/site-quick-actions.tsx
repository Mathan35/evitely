import type { ReactNode } from 'react';
import { SiteSectionChrome } from '@/components/marketing/site-previews/site-section-chrome';
import { useInvitationCopy } from '@/hooks/use-invitation-copy';
import { cn } from '@/lib/utils';

function isExternalHref(href: string): boolean {
    return /^(https?:|mailto:|tel:|sms:)/i.test(href);
}

export function ActionCard({
    icon,
    title,
    subtitle,
    href,
    onClick,
    openInNewTab,
}: {
    icon: ReactNode;
    title: string;
    subtitle: string;
    href?: string;
    onClick?: () => void;
    /** Force a new tab (e.g. same-origin card preview). Defaults to http(s) links. */
    openInNewTab?: boolean;
}) {
    const body = (
        <>
            <span className="site-action-card__icon" aria-hidden>
                {icon}
            </span>
            <p className="site-action-card__title mt-4 break-words font-serif text-[1.35rem] leading-tight font-light italic sm:text-[1.5rem] sm:leading-none">
                {title}
            </p>
            <p className="site-action-card__subtitle mt-2 text-sm leading-5 text-[var(--w-muted)]">{subtitle}</p>
        </>
    );

    if (href) {
        const external = isExternalHref(href);
        const newTab = openInNewTab ?? href.startsWith('http');

        return (
            <a
                href={href}
                target={newTab ? '_blank' : undefined}
                rel={newTab ? 'noreferrer' : undefined}
                data-preview-reveal
                className="site-action-card preview-reveal mb-3 block cursor-pointer text-left"
                // Keep tel/mailto/sms as real navigations; don't let parent handlers cancel.
                onClick={external ? undefined : onClick}
            >
                {body}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            data-preview-reveal
            className="site-action-card preview-reveal mb-3 w-full cursor-pointer text-left"
        >
            {body}
        </button>
    );
}

export function SiteRsvpActionsSection({
    id = 'gh-rsvp',
    desktop = false,
    eyebrow,
    subtitle,
    children,
    cta,
}: {
    id?: string;
    desktop?: boolean;
    eyebrow: ReactNode;
    subtitle?: ReactNode;
    children: ReactNode;
    cta?: ReactNode;
}) {
    const ui = useInvitationCopy();

    return (
        <section
            id={id}
            data-preview-reveal
            className={cn('site-rsvp-actions preview-reveal relative px-5 pb-10 text-center', desktop && 'px-10')}
        >
            <div className="site-rsvp-actions__panel relative overflow-hidden rounded-[1.85rem] px-4 pt-8 pb-6 sm:px-6 sm:pt-10 sm:pb-8">
                <div className="site-rsvp-actions__glow" aria-hidden />
                <SiteSectionChrome
                    eyebrow={eyebrow}
                    title={ui.quickActions}
                    subtitle={subtitle}
                    titleClassName="italic"
                />
                <div className={cn('relative mt-8', desktop && 'grid grid-cols-3 gap-3 [&>*]:mb-0')}>
                    {children}
                </div>
                {cta ? <div className={cn('relative mt-4', desktop && 'mt-8')}>{cta}</div> : null}
            </div>
        </section>
    );
}
