import { Link, type InertiaLinkProps } from '@inertiajs/react';
import { BrandMarkIcon } from '@/components/brand-mark-icon';
import { cn } from '@/lib/utils';

const BRAND_NAME = 'Evitely';

export function BrandMark({
    href = '/',
    light = false,
    className,
    showName = true,
    iconClassName,
}: {
    href?: InertiaLinkProps['href'];
    light?: boolean;
    className?: string;
    /** When false, only the mark icon is shown. */
    showName?: boolean;
    iconClassName?: string;
}) {
    return (
        <Link
            href={href}
            aria-label={BRAND_NAME}
            className={cn(
                'inline-flex shrink-0 items-center gap-2 font-serif tracking-tight',
                showName ? 'text-lg sm:gap-2.5 sm:text-xl' : '',
                light ? 'text-[#f4efe6]' : 'text-[#241c16] dark:text-zinc-50',
                className,
            )}
        >
            <BrandMarkIcon
                tone={light ? 'light' : 'color'}
                className={cn(
                    showName ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-8 w-8 sm:h-9 sm:w-9',
                    iconClassName,
                )}
            />
            {showName ? <span className="whitespace-nowrap leading-none">{BRAND_NAME}</span> : null}
        </Link>
    );
}
