<?php

namespace App\Support;

/**
 * Per-style blank-panel insets [top, right, bottom, left] as percentages.
 * Mirrors resources/js/lib/*-card-safe-zones.ts used by InvitationCardFace.
 */
class CardSafeZones
{
    /**
     * @return array{0: float, 1: float, 2: float, 3: float}
     */
    public static function inset(string $kind, ?string $styleKey, bool $compact = false): array
    {
        $zones = self::zones();
        $map = $zones[$kind] ?? [];
        $zone = $map[$styleKey ?? ''] ?? self::fallback($kind);
        $pad = $compact ? 1.4 : 0.8;

        return [
            (float) $zone[0] + $pad,
            (float) $zone[1] + $pad,
            (float) $zone[2] + $pad,
            (float) $zone[3] + $pad,
        ];
    }

    /**
     * @return array{0: float, 1: float, 2: float, 3: float}
     */
    private static function fallback(string $kind): array
    {
        return match ($kind) {
            'housewarming' => [38.0, 17.5, 15.0, 17.5],
            'wedding' => [16.0, 17.5, 15.0, 17.5],
            default => [24.0, 22.0, 28.0, 22.0],
        };
    }

    /**
     * @return array<string, array<string, array{0: int, 1: int, 2: int, 3: int}>>
     */
    private static function zones(): array
    {
        return [
            'baby-shower' => [
                'minimal-teddy' => [16, 16, 28, 18],
                'retro-love' => [24, 10, 30, 10],
                'floral-bloom' => [20, 10, 32, 10],
            ],
            'birthday' => [
                'neon-glow' => [26, 22, 32, 20],
                'midnight-velvet' => [24, 16, 36, 22],
                'boho-sunset' => [26, 28, 30, 18],
                'y2k-disco' => [16, 20, 34, 28],
                'english-garden' => [22, 26, 38, 26],
                'gold-leaf-40' => [26, 20, 22, 22],
                'comic' => [20, 26, 30, 24],
                'safari' => [24, 22, 24, 24],
                'typographic' => [18, 18, 22, 18],
                'balloon' => [26, 22, 28, 26],
                'galaxy' => [26, 22, 30, 24],
                'campfire' => [22, 26, 30, 26],
                'brunch' => [20, 22, 24, 24],
                'carnival' => [24, 26, 28, 26],
                'cyberpunk' => [22, 16, 28, 20],
                'jubilee' => [24, 26, 30, 26],
                'pastel' => [26, 26, 30, 26],
                'sea' => [20, 24, 26, 24],
                'artsy' => [26, 26, 28, 26],
                'ticket' => [28, 26, 30, 26],
            ],
            'bridal-shower' => [
                'blush-filigree' => [16, 16, 18, 16],
                'gold-crystal-oval' => [18, 16, 24, 16],
                'pink-oval-rose' => [16, 16, 22, 16],
                'pearl-vine' => [18, 16, 22, 14],
                'emboss-gold-panel' => [16, 12, 16, 22],
                'cream-oval-sculpt' => [16, 16, 20, 16],
                'ivory-capsule' => [18, 14, 18, 14],
                'anime-bride' => [10, 12, 42, 28],
                'tulip-bride' => [18, 14, 36, 14],
                'pearl-couple' => [16, 16, 28, 16],
                'pearl-gold-frame' => [14, 18, 14, 18],
                'veil-roses' => [10, 12, 42, 12],
                'pajama-blush' => [18, 12, 34, 12],
                'pearl-bow' => [10, 12, 40, 12],
                'ribbon-right' => [12, 32, 22, 12],
                'cream-panel' => [14, 12, 18, 14],
                'left-ribbon' => [10, 8, 12, 36],
                'rose-pearl' => [18, 16, 18, 14],
                'pajama-burgundy' => [16, 14, 34, 16],
                'marble-ribbon' => [16, 14, 18, 14],
            ],
            'corporate' => [
                'boardroom-blueprint' => [18, 22, 18, 22],
                'celebration-hands-wave' => [14, 12, 28, 12],
                'purple-office-team' => [14, 12, 34, 12],
                'peach-office-desk' => [10, 12, 48, 12],
                'online-cert-desk' => [10, 12, 32, 14],
                'corner-tech-exam' => [22, 18, 24, 18],
                'math-sage-oval' => [18, 16, 20, 16],
                'book-forum-readers' => [18, 14, 30, 14],
                'megaphone-announce' => [14, 14, 28, 14],
                'exam-pc-corners' => [18, 18, 28, 16],
                'blue-binder-circle' => [14, 14, 34, 16],
                'desk-workspace-hands' => [12, 14, 38, 14],
                'tech-desk-blue' => [18, 16, 36, 16],
                'skyline-team-v' => [10, 12, 48, 12],
                'handshake-flare' => [18, 12, 40, 12],
                'stationery-cream-frame' => [16, 14, 18, 14],
                'mint-chart-growth' => [16, 14, 28, 14],
                'ink-desk-gadgets' => [18, 16, 22, 16],
                'gear-bulb-frame' => [16, 14, 22, 14],
                'presentation-torn-header' => [36, 12, 16, 28],
            ],
            'custom' => [
                'sunset-art' => [14, 12, 14, 12],
                'next-project' => [14, 12, 14, 12],
                'ivy-estate' => [14, 12, 14, 12],
            ],
            'graduation' => [
                'kraft-scrap' => [16, 16, 22, 16],
                'classroom-fade' => [10, 12, 30, 12],
                'chalkboard-rows' => [10, 12, 42, 12],
                'autumn-books' => [18, 16, 18, 16],
                'library-shelves' => [10, 20, 22, 20],
                'stationery-desk' => [24, 18, 24, 18],
                'backpack-autumn' => [18, 16, 28, 16],
                'school-bunting' => [20, 16, 22, 16],
                'students-horizon' => [22, 14, 28, 14],
                'cap-diploma' => [24, 14, 18, 14],
                'scholarly-desk' => [14, 12, 32, 12],
                'doodle-dreams' => [16, 22, 22, 22],
                'book-tree' => [18, 12, 36, 12],
                'gold-florals' => [26, 16, 24, 16],
                'yellow-graduate' => [22, 12, 32, 14],
                'gold-ribbon' => [20, 14, 18, 14],
                'damask-cap' => [24, 12, 22, 12],
                'rose-books' => [18, 12, 30, 12],
                'navy-filigree' => [16, 14, 32, 12],
                'chalk-classroom' => [20, 16, 40, 16],
            ],
            'housewarming' => [
                'key-corner-filigree' => [20, 12, 12, 14],
                'split-peach-cottage' => [10, 12, 32, 12],
                'keys-gold-frame' => [22, 12, 26, 12],
                'top-cottage-watercolor' => [52, 12, 8, 12],
                'palm-villa' => [10, 12, 26, 12],
                'pink-floral-cottage' => [22, 12, 28, 12],
                'linen-modern-house' => [10, 12, 30, 12],
                'linen-sketch-house' => [10, 12, 36, 12],
                'mandala-garden-home' => [16, 14, 34, 12],
                'foliage-gold-outline' => [34, 34, 20, 22],
                'parchment-family-hearth' => [14, 14, 30, 12],
                'navy-rose-bluehouse' => [16, 14, 34, 14],
                'blush-heart-cottage' => [22, 12, 28, 12],
                'ink-line-cottage' => [16, 12, 24, 14],
                'country-cottage-gold' => [16, 12, 36, 12],
                'mediterranean-blue-door' => [8, 12, 44, 12],
                'mint-arch-cottage' => [18, 14, 32, 14],
                'night-moon-cottage' => [10, 12, 28, 12],
                'chimney-cloud-cottage' => [12, 12, 36, 12],
                'peach-bloom-cottage' => [16, 18, 26, 16],
            ],
            'party' => [
                'confetti-hats' => [16, 18, 18, 18],
                'ribbon-stars' => [14, 16, 16, 16],
                'bunting-balloons' => [20, 18, 22, 18],
                'sketch-dinner' => [16, 14, 32, 16],
                'balloon-blush' => [26, 22, 18, 22],
                'disco-sketch' => [22, 22, 28, 22],
                'linen-feast' => [12, 12, 32, 12],
                'garden-table' => [12, 12, 28, 12],
                'classical-arch' => [18, 16, 22, 16],
                'navy-icons' => [20, 14, 26, 14],
                'gift-cake' => [24, 14, 26, 14],
                'rose-gold' => [14, 14, 18, 14],
                'watercolor-gifts' => [20, 14, 30, 14],
                'blossom-arch' => [18, 18, 22, 18],
                'lantern-drape' => [28, 18, 22, 18],
                'peach-arch' => [24, 16, 20, 16],
                'pink-party' => [16, 14, 32, 14],
                'cocktail-spread' => [16, 14, 28, 18],
                'feast-lights' => [24, 18, 28, 18],
                'confetti-flags' => [28, 14, 12, 14],
            ],
        ];
    }
}
