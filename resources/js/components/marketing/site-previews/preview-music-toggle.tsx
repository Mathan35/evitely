import { Music2, Volume2, VolumeX } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/** Floating music control — matches the soft “PLAYING” pill + speaker from the reference. */
export function PreviewMusicToggle({
    muted,
    onToggle,
    className,
    style,
}: {
    muted: boolean;
    onToggle: () => void;
    className?: string;
    style?: CSSProperties;
}) {
    const playing = !muted;

    return (
        <div
            data-preview-music-toggle
            style={style}
            className={cn('preview-music-control', playing && 'is-playing', className)}
        >
            {playing ? (
                <span className="preview-music-control__status" aria-hidden>
                    <Music2 className="preview-music-control__note" strokeWidth={1.75} />
                    Playing
                </span>
            ) : null}

            <button
                type="button"
                className={cn('preview-music-control__btn', playing && 'is-playing')}
                onClick={onToggle}
                aria-label={muted ? 'Unmute music' : 'Mute music'}
                aria-pressed={playing}
            >
                {playing ? (
                    <>
                        <span className="preview-music-control__ripple" aria-hidden />
                        <span className="preview-music-control__ripple preview-music-control__ripple--late" aria-hidden />
                    </>
                ) : null}
                <span className="preview-music-control__face">
                    {muted ? <VolumeX strokeWidth={1.6} /> : <Volume2 strokeWidth={1.6} />}
                </span>
            </button>
        </div>
    );
}
