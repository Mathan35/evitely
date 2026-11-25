import type { PageSkeletonKind } from '@/lib/page-skeleton';
import { cn } from '@/lib/utils';

type Cast = {
    left: string;
    right?: string;
    title: string;
    subtitle: string;
    motif: 'hearts' | 'confetti' | 'stars' | 'petals' | 'sparks' | 'envelope';
    tone: 'warm' | 'blush' | 'gold' | 'night' | 'mint' | 'sky';
};

const CUT = '/images/countdown';

function occasionFromPath(path: string | null | undefined): string | null {
    const value = (path || '').toLowerCase();
    if (value.includes('birthday')) return 'birthday';
    if (value.includes('baby-shower') || value.includes('baby')) return 'baby-shower';
    if (value.includes('bridal')) return 'bridal-shower';
    if (value.includes('graduation') || value.includes('grad')) return 'graduation';
    if (value.includes('housewarming') || value.includes('house')) return 'housewarming';
    if (value.includes('corporate')) return 'corporate';
    if (value.includes('party')) return 'party';
    if (value.includes('custom')) return 'custom';
    if (value.includes('wedding')) return 'wedding';
    return null;
}

function castForKind(kind: PageSkeletonKind, path?: string | null): Cast {
    const occasion = occasionFromPath(path);

    if (occasion === 'birthday') {
        return {
            left: `${CUT}/birthday-celebrant-cut.png`,
            right: `${CUT}/birthday-balloon-cut.png`,
            title: 'Lighting the candles…',
            subtitle: 'Your birthday invite is almost ready to celebrate.',
            motif: 'confetti',
            tone: 'blush',
        };
    }
    if (occasion === 'baby-shower') {
        return {
            left: `${CUT}/babyshower-parent-cut.png`,
            right: `${CUT}/babyshower-stork-cut.png`,
            title: 'Soft landing ahead…',
            subtitle: 'Gathering pastel moments for the little one.',
            motif: 'petals',
            tone: 'blush',
        };
    }
    if (occasion === 'bridal-shower') {
        return {
            left: `${CUT}/bridal-bride-cut.png`,
            right: `${CUT}/bridal-friend-cut.png`,
            title: 'From miss to mrs…',
            subtitle: 'Setting the blush table for her shower.',
            motif: 'petals',
            tone: 'blush',
        };
    }
    if (occasion === 'graduation') {
        return {
            left: `${CUT}/grad-student-cut.png`,
            right: `${CUT}/grad-classmate-cut.png`,
            title: 'Caps in the air…',
            subtitle: 'Composing a commencement-worthy invite.',
            motif: 'stars',
            tone: 'mint',
        };
    }
    if (occasion === 'housewarming') {
        return {
            left: `${CUT}/house-host-cut.png`,
            right: `${CUT}/house-guest-cut.png`,
            title: 'Welcome home…',
            subtitle: 'Warming the hearth for your housewarming.',
            motif: 'sparks',
            tone: 'warm',
        };
    }
    if (occasion === 'corporate') {
        return {
            left: `${CUT}/corporate-presenter-cut.png`,
            right: `${CUT}/corporate-colleague-cut.png`,
            title: 'Summit assembling…',
            subtitle: 'Polishing a sharp corporate invitation.',
            motif: 'stars',
            tone: 'sky',
        };
    }
    if (occasion === 'party') {
        return {
            left: `${CUT}/party-host-cut.png`,
            right: `${CUT}/party-guest-cut.png`,
            title: 'Party starting…',
            subtitle: 'Cue the lights — your celebration site is loading.',
            motif: 'confetti',
            tone: 'gold',
        };
    }
    if (occasion === 'custom') {
        return {
            left: `${CUT}/custom-char-magician-cut.png`,
            right: `${CUT}/custom-mascot-cut.png`,
            title: 'Custom magic…',
            subtitle: 'Spinning a one-of-a-kind invitation scene.',
            motif: 'sparks',
            tone: 'gold',
        };
    }

    switch (kind) {
        case 'welcome':
            return {
                left: `${CUT}/groom-cut.png`,
                right: `${CUT}/bride-cut.png`,
                title: 'Welcome to Invidora',
                subtitle: 'Beautiful invitations are gathering for you.',
                motif: 'hearts',
                tone: 'warm',
            };
        case 'designs':
        case 'formats':
        case 'seo':
            return {
                left: `${CUT}/bride-cut.png`,
                right: `${CUT}/groom-cut.png`,
                title: 'Browsing templates…',
                subtitle: 'Finding the perfect look for your celebration.',
                motif: 'petals',
                tone: 'gold',
            };
        case 'gallery':
            return {
                left: `${CUT}/bride-cut.png`,
                right: `${CUT}/groom-cut.png`,
                title: 'Opening the gallery…',
                subtitle: 'Laying out card & site designs for this occasion.',
                motif: 'stars',
                tone: 'warm',
            };
        case 'dashboard':
            return {
                left: `${CUT}/custom-char-herald-cut.png`,
                right: `${CUT}/custom-char-owl-cut.png`,
                title: 'Studio waking up…',
                subtitle: 'Your celebration dashboard is almost in view.',
                motif: 'sparks',
                tone: 'gold',
            };
        case 'events-index':
        case 'events-create':
        case 'events-show':
            return {
                left: `${CUT}/party-host-cut.png`,
                right: `${CUT}/party-guest-cut.png`,
                title: kind === 'events-create' ? 'Starting a new invite…' : 'Gathering your events…',
                subtitle:
                    kind === 'events-create'
                        ? 'Choose an occasion — we will set the stage.'
                        : 'Pulling together every celebration in your studio.',
                motif: 'confetti',
                tone: 'warm',
            };
        case 'guests':
            return {
                left: `${CUT}/custom-char-dancer-cut.png`,
                right: `${CUT}/custom-char-musician-cut.png`,
                title: 'Checking the guest list…',
                subtitle: 'Seating charts and RSVPs are lining up.',
                motif: 'stars',
                tone: 'blush',
            };
        case 'analytics':
            return {
                left: `${CUT}/custom-char-scientist-cut.png`,
                right: `${CUT}/custom-char-fox-cut.png`,
                title: 'Reading the room…',
                subtitle: 'Crunching views, opens, and celebration buzz.',
                motif: 'sparks',
                tone: 'sky',
            };
        case 'settings':
            return {
                left: `${CUT}/custom-char-gardener-cut.png`,
                title: 'Tuning your studio…',
                subtitle: 'Profile, security, and appearance — almost there.',
                motif: 'sparks',
                tone: 'mint',
            };
        case 'auth':
            return {
                left: `${CUT}/custom-char-herald-cut.png`,
                title: 'Opening the gate…',
                subtitle: 'Sign in to save favorites and craft invitations.',
                motif: 'envelope',
                tone: 'gold',
            };
        case 'site-editor':
            return {
                left: `${CUT}/groom-cut.png`,
                right: `${CUT}/bride-cut.png`,
                title: 'Preparing your site editor…',
                subtitle: 'Live preview, styles, and sections loading in.',
                motif: 'petals',
                tone: 'warm',
            };
        case 'card-editor':
            return {
                left: `${CUT}/bridal-bride-cut.png`,
                right: `${CUT}/custom-char-artist-cut.png`,
                title: 'Opening the card studio…',
                subtitle: 'Fonts, flourishes, and artboards are warming up.',
                motif: 'envelope',
                tone: 'blush',
            };
        case 'preview':
            return {
                left: `${CUT}/bride-cut.png`,
                right: `${CUT}/groom-cut.png`,
                title: 'Dress rehearsal…',
                subtitle: 'Previewing your invitation just as guests will see it.',
                motif: 'hearts',
                tone: 'night',
            };
        case 'public-site':
            return {
                left: `${CUT}/groom-cut.png`,
                right: `${CUT}/bride-cut.png`,
                title: 'Your invitation awaits…',
                subtitle: 'Unwrapping the celebration site for you.',
                motif: 'hearts',
                tone: 'warm',
            };
        case 'public-card':
            return {
                left: `${CUT}/birthday-gift-cut.png`,
                right: `${CUT}/bridal-bride-cut.png`,
                title: 'Opening your card…',
                subtitle: 'A keepsake invite is unfolding.',
                motif: 'envelope',
                tone: 'gold',
            };
        case 'error':
            return {
                left: `${CUT}/custom-char-robot-cut.png`,
                title: 'Detour ahead…',
                subtitle: 'We are gathering a friendly path back home.',
                motif: 'sparks',
                tone: 'sky',
            };
        default:
            return {
                left: `${CUT}/bride-cut.png`,
                right: `${CUT}/groom-cut.png`,
                title: 'Almost ready…',
                subtitle: 'Something lovely is loading for your celebration.',
                motif: 'hearts',
                tone: 'warm',
            };
    }
}

const TONE_CLASS: Record<Cast['tone'], string> = {
    warm: 'festive-loader--warm',
    blush: 'festive-loader--blush',
    gold: 'festive-loader--gold',
    night: 'festive-loader--night',
    mint: 'festive-loader--mint',
    sky: 'festive-loader--sky',
};

function MotifLayer({ motif }: { motif: Cast['motif'] }) {
    const items = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div className="festive-loader__motifs" aria-hidden>
            {items.map((i) => (
                <span
                    key={i}
                    className={cn('festive-loader__motif', `festive-loader__motif--${motif}`)}
                    style={{
                        ['--m-i' as string]: i,
                        ['--m-x' as string]: `${8 + ((i * 17) % 84)}%`,
                        ['--m-delay' as string]: `${(i % 8) * 0.18}s`,
                        ['--m-dur' as string]: `${2.4 + (i % 5) * 0.35}s`,
                    }}
                />
            ))}
        </div>
    );
}

export function FestivePageLoader({
    kind,
    path,
    className,
    compact = false,
}: {
    kind: PageSkeletonKind;
    /** Destination URL or component — drives occasion-specific casts on gallery pages. */
    path?: string | null;
    className?: string;
    compact?: boolean;
}) {
    const cast = castForKind(kind, path);

    return (
        <div
            className={cn(
                'festive-loader',
                TONE_CLASS[cast.tone],
                compact && 'festive-loader--compact',
                className,
            )}
            data-festive-loader={kind}
            aria-hidden
        >
            <div className="festive-loader__glow" aria-hidden />
            <MotifLayer motif={cast.motif} />

            <div className="festive-loader__stage">
                <div className="festive-loader__ring" aria-hidden />
                <div className="festive-loader__cast">
                    <img
                        src={cast.left}
                        alt=""
                        className="festive-loader__char festive-loader__char--left"
                        draggable={false}
                    />
                    {cast.right ? (
                        <img
                            src={cast.right}
                            alt=""
                            className="festive-loader__char festive-loader__char--right"
                            draggable={false}
                        />
                    ) : null}
                </div>
                <div className="festive-loader__seal" aria-hidden>
                    <span className="festive-loader__seal-dot" />
                </div>
            </div>

            <p className="festive-loader__title">{cast.title}</p>
            <p className="festive-loader__subtitle">{cast.subtitle}</p>
            <div className="festive-loader__progress" aria-hidden>
                <span className="festive-loader__progress-bar" />
            </div>
        </div>
    );
}

/** Compact inline loader for settings/auth panel shells. */
export function FestivePanelLoader({
    kind = 'settings',
    className,
}: {
    kind?: PageSkeletonKind;
    className?: string;
}) {
    return <FestivePageLoader kind={kind} compact className={cn('min-h-[40vh]', className)} />;
}
