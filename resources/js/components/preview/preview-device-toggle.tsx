import { cn } from '@/lib/utils';
import type { PreviewDevice } from '@/lib/preview-device';

function PhoneGlyph() {
    return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
            <rect x="7" y="2.75" width="10" height="18.5" rx="2.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10.75 18.75h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function DesktopGlyph() {
    return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
            <rect x="2.75" y="4" width="18.5" height="12.5" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 20.25h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 16.5v3.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="5.6" cy="6.7" r="0.7" fill="currentColor" />
            <circle cx="7.7" cy="6.7" r="0.7" fill="currentColor" />
        </svg>
    );
}

const OPTIONS = [
    { id: 'mobile' as const, label: 'Mobile view', icon: PhoneGlyph },
    { id: 'desktop' as const, label: 'Desktop view', icon: DesktopGlyph },
];

export function PreviewDeviceToggle({
    device,
    onChange,
    className,
}: {
    device: PreviewDevice;
    onChange: (device: PreviewDevice) => void;
    className?: string;
}) {
    return (
        <div
            role="radiogroup"
            aria-label="Preview viewport"
            data-device={device}
            className={cn('preview-device-toggle', className)}
        >
            <span className="preview-device-thumb" aria-hidden />
            {OPTIONS.map((option) => {
                const active = device === option.id;
                const Icon = option.icon;

                return (
                    <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={option.label}
                        title={option.label}
                        onClick={() => onChange(option.id)}
                        className={cn('preview-device-btn', active && 'is-active')}
                    >
                        <Icon />
                    </button>
                );
            })}
        </div>
    );
}
