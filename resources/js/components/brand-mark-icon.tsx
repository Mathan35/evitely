import type { SVGAttributes } from 'react';
import { cn } from '@/lib/utils';

type BrandMarkIconProps = SVGAttributes<SVGElement> & {
    /** `color` = full brand palette; `light` = cream/gold for dark surfaces. */
    tone?: 'color' | 'light';
};

/**
 * Invidora mark: open invitation + guest-site window + wax seal.
 * Colorful, neat, no background tile.
 */
export function BrandMarkIcon({ className, style, tone = 'color', ...props }: BrandMarkIconProps) {
    const light = tone === 'light';

    const ink = light ? '#f6f1e8' : '#2b241c';
    const paper = light ? 'rgba(246,241,232,0.14)' : '#f7f0e6';
    const gold = '#c6a36a';
    const coral = light ? '#e2b08a' : '#d4896a';
    const sage = light ? '#b7c9a8' : '#7d9b78';
    const windowFill = light ? 'rgba(198,163,106,0.18)' : '#fff9f0';
    const sealInk = light ? '#f6f1e8' : '#2b241c';

    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('block h-7 w-7 shrink-0 sm:h-8 sm:w-8', className)}
            aria-hidden="true"
            style={style}
            {...props}
        >
            {/* Soft paper body */}
            <path
                d="M9.2 14.8h21.6c1.1 0 2 .9 2 2v11.6c0 1.1-.9 2-2 2H9.2c-1.1 0-2-.9-2-2V16.8c0-1.1.9-2 2-2Z"
                fill={paper}
                stroke={ink}
                strokeWidth="1.55"
                strokeLinejoin="round"
            />

            {/* Open flap — gold wash */}
            <path d="M9.75 14.85 20 8.05 30.25 14.85Z" fill={gold} fillOpacity={light ? 0.35 : 0.22} />
            <path
                d="M9.6 14.9 20 7.4 30.4 14.9"
                stroke={gold}
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Side flaps — warm coral */}
            <path
                d="M7.2 16.2 3.4 19.8c-.55.52-.18 1.42.55 1.42H8.2"
                stroke={coral}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M32.8 16.2 36.6 19.8c.55.52.18 1.42-.55 1.42H31.8"
                stroke={coral}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Guest-site window */}
            <rect x="12.4" y="16.8" width="15.2" height="10.4" rx="2.1" fill={windowFill} stroke={ink} strokeWidth="1.35" />
            <path d="M12.4 19.55h15.2" stroke={gold} strokeWidth="1.45" strokeLinecap="round" />
            <circle cx="14.45" cy="18.15" r="0.7" fill={coral} />
            <circle cx="16.35" cy="18.15" r="0.7" fill={gold} />
            <circle cx="18.25" cy="18.15" r="0.7" fill={sage} />

            {/* Tiny site sparkle */}
            <path
                d="M25.2 22.1h2.2M26.3 21v2.2"
                stroke={gold}
                strokeWidth="1.05"
                strokeLinecap="round"
            />

            {/* Wax seal */}
            <circle cx="20" cy="31.15" r="3.35" fill={gold} />
            <circle cx="20" cy="31.15" r="2.35" fill="none" stroke={sealInk} strokeOpacity="0.22" strokeWidth="0.9" />
            <path
                d="M20 29.55v3.2M18.4 31.15h3.2"
                stroke={sealInk}
                strokeWidth="1.2"
                strokeLinecap="round"
            />
        </svg>
    );
}
