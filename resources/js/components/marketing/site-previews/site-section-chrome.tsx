import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Shared ornamental heading for invitation site sections. */
export function SiteSectionChrome({
    eyebrow,
    title,
    subtitle,
    align = 'center',
    className,
    titleClassName,
    children,
}: {
    eyebrow?: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    align?: 'center' | 'left';
    className?: string;
    titleClassName?: string;
    children?: ReactNode;
}) {
    const centered = align === 'center';

    return (
        <header className={cn('site-section-chrome relative', centered && 'text-center', className)}>
            <div className={cn('site-section-chrome__wash', !centered && 'site-section-chrome__wash--left')} aria-hidden />
            {eyebrow ? (
                <p className="site-section-chrome__eyebrow relative">{eyebrow}</p>
            ) : null}
            <h3 className={cn('site-section-chrome__title relative', titleClassName)}>{title}</h3>
            <span className={cn('site-section-chrome__rule relative', !centered && 'mx-0')} aria-hidden>
                <span className="site-section-chrome__diamond" />
            </span>
            {subtitle ? (
                <div className={cn('site-section-chrome__subtitle relative', centered && 'mx-auto')}>{subtitle}</div>
            ) : null}
            {children}
        </header>
    );
}
