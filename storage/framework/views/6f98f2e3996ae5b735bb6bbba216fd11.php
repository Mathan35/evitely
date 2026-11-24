<?php
    $component = $page['component'] ?? 'welcome';
    $url = $page['url'] ?? request()->path();
    $kind = match (true) {
        $component === 'welcome' => 'welcome',
        $component === 'seo/landing' => 'seo',
        $component === 'marketing/designs' => 'designs',
        $component === 'marketing/event-gallery' => 'gallery',
        $component === 'marketing/wedding-formats' => 'formats',
        $component === 'dashboard' => 'dashboard',
        $component === 'weddings/index' => 'events-index',
        $component === 'weddings/create' => 'events-create',
        $component === 'weddings/show' => 'events-show',
        $component === 'studio/guests' => 'guests',
        $component === 'studio/analytics' => 'analytics',
        str_starts_with($component, 'settings/') => 'settings',
        str_starts_with($component, 'auth/') => 'auth',
        $component === 'weddings/edit' => 'site-editor',
        $component === 'events/card' => 'card-editor',
        $component === 'weddings/preview' => 'preview',
        $component === 'public/wedding' => 'public-site',
        $component === 'public/card' => 'public-card',
        $component === 'errors/show' => 'error',
        default => 'generic',
    };

    $path = strtolower((string) $url);
    $occasion = match (true) {
        str_contains($path, 'birthday') => 'birthday',
        str_contains($path, 'baby-shower') || str_contains($path, 'baby') => 'baby-shower',
        str_contains($path, 'bridal') => 'bridal-shower',
        str_contains($path, 'graduation') || str_contains($path, 'grad') => 'graduation',
        str_contains($path, 'housewarming') => 'housewarming',
        str_contains($path, 'corporate') => 'corporate',
        str_contains($path, 'party') => 'party',
        str_contains($path, 'custom') => 'custom',
        default => null,
    };

    $cut = '/images/countdown';
    $cast = match ($occasion) {
        'birthday' => [
            'left' => "{$cut}/birthday-celebrant-cut.png",
            'right' => "{$cut}/birthday-balloon-cut.png",
            'title' => 'Lighting the candles…',
            'subtitle' => 'Your birthday invite is almost ready to celebrate.',
            'tone' => 'blush',
        ],
        'baby-shower' => [
            'left' => "{$cut}/babyshower-parent-cut.png",
            'right' => "{$cut}/babyshower-stork-cut.png",
            'title' => 'Soft landing ahead…',
            'subtitle' => 'Gathering pastel moments for the little one.',
            'tone' => 'blush',
        ],
        'bridal-shower' => [
            'left' => "{$cut}/bridal-bride-cut.png",
            'right' => "{$cut}/bridal-friend-cut.png",
            'title' => 'From miss to mrs…',
            'subtitle' => 'Setting the blush table for her shower.',
            'tone' => 'blush',
        ],
        'graduation' => [
            'left' => "{$cut}/grad-student-cut.png",
            'right' => "{$cut}/grad-classmate-cut.png",
            'title' => 'Caps in the air…',
            'subtitle' => 'Composing a commencement-worthy invite.',
            'tone' => 'mint',
        ],
        'housewarming' => [
            'left' => "{$cut}/house-host-cut.png",
            'right' => "{$cut}/house-guest-cut.png",
            'title' => 'Welcome home…',
            'subtitle' => 'Warming the hearth for your housewarming.',
            'tone' => 'warm',
        ],
        'corporate' => [
            'left' => "{$cut}/corporate-presenter-cut.png",
            'right' => "{$cut}/corporate-colleague-cut.png",
            'title' => 'Summit assembling…',
            'subtitle' => 'Polishing a sharp corporate invitation.',
            'tone' => 'sky',
        ],
        'party' => [
            'left' => "{$cut}/party-host-cut.png",
            'right' => "{$cut}/party-guest-cut.png",
            'title' => 'Party starting…',
            'subtitle' => 'Cue the lights — your celebration site is loading.',
            'tone' => 'gold',
        ],
        'custom' => [
            'left' => "{$cut}/custom-char-magician-cut.png",
            'right' => "{$cut}/custom-mascot-cut.png",
            'title' => 'Custom magic…',
            'subtitle' => 'Spinning a one-of-a-kind invitation scene.',
            'tone' => 'gold',
        ],
        default => match ($kind) {
            'welcome' => [
                'left' => "{$cut}/groom-cut.png",
                'right' => "{$cut}/bride-cut.png",
                'title' => 'Welcome to Evitely',
                'subtitle' => 'Beautiful invitations are gathering for you.',
                'tone' => 'warm',
            ],
            'designs', 'formats', 'seo', 'gallery' => [
                'left' => "{$cut}/bride-cut.png",
                'right' => "{$cut}/groom-cut.png",
                'title' => 'Browsing templates…',
                'subtitle' => 'Finding the perfect look for your celebration.',
                'tone' => 'gold',
            ],
            'dashboard' => [
                'left' => "{$cut}/custom-char-herald-cut.png",
                'right' => "{$cut}/custom-char-owl-cut.png",
                'title' => 'Studio waking up…',
                'subtitle' => 'Your celebration dashboard is almost in view.',
                'tone' => 'gold',
            ],
            'events-index', 'events-create', 'events-show' => [
                'left' => "{$cut}/party-host-cut.png",
                'right' => "{$cut}/party-guest-cut.png",
                'title' => $kind === 'events-create' ? 'Starting a new invite…' : 'Gathering your events…',
                'subtitle' => 'Pulling together every celebration in your studio.',
                'tone' => 'warm',
            ],
            'guests' => [
                'left' => "{$cut}/custom-char-dancer-cut.png",
                'right' => "{$cut}/custom-char-musician-cut.png",
                'title' => 'Checking the guest list…',
                'subtitle' => 'Seating charts and RSVPs are lining up.',
                'tone' => 'blush',
            ],
            'analytics' => [
                'left' => "{$cut}/custom-char-scientist-cut.png",
                'right' => "{$cut}/custom-char-fox-cut.png",
                'title' => 'Reading the room…',
                'subtitle' => 'Crunching views, opens, and celebration buzz.',
                'tone' => 'sky',
            ],
            'settings' => [
                'left' => "{$cut}/custom-char-gardener-cut.png",
                'right' => null,
                'title' => 'Tuning your studio…',
                'subtitle' => 'Profile, security, and appearance — almost there.',
                'tone' => 'mint',
            ],
            'auth' => [
                'left' => "{$cut}/custom-char-herald-cut.png",
                'right' => null,
                'title' => 'Opening the gate…',
                'subtitle' => 'Sign in to save favorites and craft invitations.',
                'tone' => 'gold',
            ],
            'site-editor', 'preview', 'public-site' => [
                'left' => "{$cut}/groom-cut.png",
                'right' => "{$cut}/bride-cut.png",
                'title' => $kind === 'public-site' ? 'Your invitation awaits…' : 'Preparing your site…',
                'subtitle' => 'Live celebration moments are loading in.',
                'tone' => $kind === 'preview' ? 'night' : 'warm',
            ],
            'card-editor', 'public-card' => [
                'left' => "{$cut}/bridal-bride-cut.png",
                'right' => "{$cut}/custom-char-artist-cut.png",
                'title' => 'Opening your card…',
                'subtitle' => 'A keepsake invite is unfolding.',
                'tone' => 'blush',
            ],
            'error' => [
                'left' => "{$cut}/custom-char-robot-cut.png",
                'right' => null,
                'title' => 'Detour ahead…',
                'subtitle' => 'We are gathering a friendly path back home.',
                'tone' => 'sky',
            ],
            default => [
                'left' => "{$cut}/bride-cut.png",
                'right' => "{$cut}/groom-cut.png",
                'title' => 'Almost ready…',
                'subtitle' => 'Something lovely is loading for your celebration.',
                'tone' => 'warm',
            ],
        },
    };

    $dark = in_array($kind, ['preview', 'public-card'], true) || ($cast['tone'] ?? '') === 'night';
?>

<div
    id="app-boot-skeleton"
    data-skeleton-kind="<?php echo e($kind); ?>"
    data-page-component="<?php echo e($component); ?>"
    data-festive-boot="1"
    aria-hidden="true"
    style="<?php echo e($dark ? 'background:radial-gradient(ellipse 70% 50% at 50% 40%,rgba(180,120,60,.18),transparent 65%),linear-gradient(165deg,#14110e,#1c1814 55%,#12100e);color:#f4efe6;' : ''); ?>"
>
    <div class="festive-loader festive-loader--<?php echo e($cast['tone']); ?>">
        <div class="festive-loader__glow" aria-hidden="true"></div>
        <div class="festive-loader__motifs" aria-hidden="true">
            <?php for($i = 0; $i < 10; $i++): ?>
                <span
                    class="festive-loader__motif festive-loader__motif--<?php echo e(in_array($kind, ['auth', 'card-editor', 'public-card'], true) ? 'envelope' : (in_array($kind, ['events-index', 'events-create', 'guests'], true) ? 'confetti' : 'hearts')); ?>"
                    style="--m-i: <?php echo e($i); ?>; --m-x: <?php echo e(8 + (($i * 17) % 84)); ?>%; --m-delay: <?php echo e(($i % 8) * 0.18); ?>s; --m-dur: <?php echo e(2.4 + ($i % 5) * 0.35); ?>s;"
                ></span>
            <?php endfor; ?>
        </div>
        <div class="festive-loader__stage">
            <div class="festive-loader__ring" aria-hidden="true"></div>
            <div class="festive-loader__cast">
                <img src="<?php echo e($cast['left']); ?>" alt="" class="festive-loader__char festive-loader__char--left" draggable="false" />
                <?php if(!empty($cast['right'])): ?>
                    <img src="<?php echo e($cast['right']); ?>" alt="" class="festive-loader__char festive-loader__char--right" draggable="false" />
                <?php endif; ?>
            </div>
            <div class="festive-loader__seal" aria-hidden="true"><span class="festive-loader__seal-dot"></span></div>
        </div>
        <p class="festive-loader__title"><?php echo e($cast['title']); ?></p>
        <p class="festive-loader__subtitle"><?php echo e($cast['subtitle']); ?></p>
        <div class="festive-loader__progress" aria-hidden="true"><span class="festive-loader__progress-bar"></span></div>
    </div>
</div>
<?php /**PATH C:\Users\Abcom\Sites\wedding-invitation\resources\views/partials/boot-skeleton.blade.php ENDPATH**/ ?>