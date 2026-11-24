<?php

namespace App\Support;

use App\Models\Wedding;

class CardLibrary
{
    /**
     * @return array<string, array{format: string, width: int, height: int, label: string}>
     */
    public static function presets(): array
    {
        return [
            // 3∶4 matches InvitationCardFace / gallery mobile cards so editor === preview.
            'invite' => ['format' => 'invite', 'width' => 1080, 'height' => 1440, 'label' => 'Invitation card (3∶4)'],
            'portrait' => ['format' => 'portrait', 'width' => 1080, 'height' => 1440, 'label' => 'Portrait invitation (3∶4)'],
            'square' => ['format' => 'square', 'width' => 1080, 'height' => 1080, 'label' => 'Instagram post'],
            'landscape' => ['format' => 'landscape', 'width' => 1200, 'height' => 628, 'label' => 'Facebook post'],
            'a5' => ['format' => 'a5', 'width' => 1748, 'height' => 2480, 'label' => 'A5'],
            'a4' => ['format' => 'a4', 'width' => 2480, 'height' => 3508, 'label' => 'A4'],
            '5x7' => ['format' => '5x7', 'width' => 1500, 'height' => 2100, 'label' => '5×7'],
            '4x6' => ['format' => '4x6', 'width' => 1200, 'height' => 1800, 'label' => '4×6'],
            'story' => ['format' => 'story', 'width' => 1080, 'height' => 1920, 'label' => 'Story / WhatsApp Status'],
            'custom' => ['format' => 'custom', 'width' => 1080, 'height' => 1080, 'label' => 'Custom'],
        ];
    }

    /**
     * @return array{format: string, width: int, height: int, label: string}
     */
    public static function preset(string $format): array
    {
        return self::presets()[$format] ?? self::presets()['invite'];
    }

    /**
     * Canvas size shared by wedding/housewarming invitation cards and InvitationCardFace (3∶4).
     *
     * @return array{format: string, width: int, height: int, label: string}
     */
    public static function invitationCanvas(?string $format = null): array
    {
        if (is_string($format) && $format !== '' && ! in_array($format, ['portrait', 'invite'], true)) {
            return self::preset($format);
        }

        return self::presets()['invite'];
    }

    /**
     * Occasions whose InvitationCardFace uses native art aspect + object-fit: contain.
     *
     * @return list<string>
     */
    public static function containArtOccasions(): array
    {
        return [
            'birthday',
            'baby-shower',
            'party',
            'graduation',
            'bridal-shower',
            'housewarming',
            'corporate',
        ];
    }

    /**
     * Canvas matching the design preview popup for a gallery template.
     * Wedding/custom stay 3∶4 (cover). Blank-center occasions use the art aspect (contain).
     *
     * @param  array<string, mixed>  $template
     * @return array{format: string, width: int, height: int, label: string}
     */
    public static function canvasForTemplate(array $template, ?string $formatOverride = null): array
    {
        $format = is_string($formatOverride) && $formatOverride !== ''
            ? $formatOverride
            : (is_string($template['format'] ?? null) ? $template['format'] : 'invite');
        $base = self::invitationCanvas($format);
        $kind = self::templateOccasionSlug($template);

        if (! in_array($kind, self::containArtOccasions(), true)) {
            return $base;
        }

        $artW = (int) ($template['image_width'] ?? 0);
        $artH = (int) ($template['image_height'] ?? 0);
        if ($artW < 1 || $artH < 1) {
            return $base;
        }

        $width = 1080;
        $height = (int) max(720, round(1080 * ($artH / $artW)));

        return [
            'format' => $base['format'],
            'width' => $width,
            'height' => $height,
            'label' => $base['label'].' (art aspect)',
        ];
    }

    /**
     * @param  array<string, mixed>  $template
     */
    public static function templateOccasionSlug(array $template): string
    {
        $eventType = (string) ($template['event_type'] ?? '');
        $id = (string) ($template['id'] ?? '');

        foreach (['bridal-shower', 'baby-shower', 'housewarming', 'graduation', 'corporate', 'birthday', 'party', 'custom', 'wedding'] as $slug) {
            if ($eventType === $slug || str_starts_with($id, $slug.'-')) {
                return $slug;
            }
        }

        if ($eventType === 'baby' || str_starts_with($id, 'floral-baby')) {
            return 'baby-shower';
        }

        return $eventType !== '' ? $eventType : 'wedding';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function templates(): array
    {
        $rows = [
            ['elegant-wedding', 'Elegant wedding', 'wedding', 'elegant', 'en', 'portrait'],
            ['traditional-wedding', 'Traditional wedding', 'wedding', 'traditional', 'en', 'portrait'],
            ['fun-birthday', 'Fun birthday', 'birthday', 'fun', 'en', 'square'],
            ['kids-birthday', 'Kids birthday', 'birthday', 'kids', 'en', 'square'],
            ['floral-baby', 'Floral baby', 'baby', 'floral', 'en', 'portrait'],
            ['luxury-anniversary', 'Luxury anniversary', 'anniversary', 'luxury', 'en', 'portrait'],
            ['traditional-house', 'Housewarming', 'housewarming', 'traditional', 'en', 'portrait'],
            ['professional-corporate', 'Professional', 'corporate', 'professional', 'en', 'landscape'],
            ['modern-graduation', 'Graduation', 'graduation', 'modern', 'en', 'portrait'],
            ['colorful-party', 'Colorful party', 'party', 'colorful', 'en', 'square'],
            ['religious-traditional', 'Ceremony', 'religious', 'traditional', 'en', 'portrait'],
            ['minimal-greeting', 'Greeting', 'greeting', 'minimal', 'en', 'square'],
        ];

        return array_map(fn (array $row): array => [
            'id' => $row[0],
            'name' => $row[1],
            'event_type' => $row[2],
            'style' => $row[3],
            'language' => $row[4],
            'format' => $row[5],
            'premium' => false,
            'background' => match ($row[3]) {
                'luxury', 'traditional' => '#1c1712',
                'fun', 'kids', 'colorful' => '#f6e7c1',
                'professional', 'modern', 'minimal' => '#f7f4ef',
                default => '#f4efe6',
            },
            'ink' => in_array($row[3], ['luxury', 'traditional'], true) ? '#f4efe6' : '#1c1712',
        ], $rows);
    }

    /**
     * @return array<string, mixed>
     */
    public static function resolve(?string $templateId, ?string $occasionSlug = null): array
    {
        if ($templateId === 'none' || $templateId === '') {
            $templateId = null;
        }

        $galleryRows = collect(DesignGallery::cardLibraryRows());
        $legacyRows = collect(self::templates());
        $normalized = is_string($occasionSlug) && $occasionSlug !== ''
            ? (DesignGallery::occasion($occasionSlug)['slug'] ?? $occasionSlug)
            : null;

        if ($templateId) {
            $exact = $galleryRows->firstWhere('id', $templateId)
                ?? $legacyRows->firstWhere('id', $templateId);
            if (is_array($exact)) {
                if ($normalized === null || self::rowMatchesOccasion($exact, $normalized)) {
                    return $exact;
                }
            }
        }

        if ($normalized !== null) {
            $forOccasion = $galleryRows->first(fn (array $row): bool => self::rowMatchesOccasion($row, $normalized));
            if (is_array($forOccasion)) {
                return $forOccasion;
            }

            $legacy = $legacyRows->first(fn (array $row): bool => self::rowMatchesOccasion($row, $normalized));
            if (is_array($legacy)) {
                return $legacy;
            }
        }

        return $galleryRows->first() ?? $legacyRows->first() ?? self::templates()[0];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function templatesForOccasion(?string $occasionSlug): array
    {
        $normalized = is_string($occasionSlug) && $occasionSlug !== ''
            ? (DesignGallery::occasion($occasionSlug)['slug'] ?? $occasionSlug)
            : null;

        $gallery = collect(DesignGallery::cardLibraryRows());
        if ($normalized !== null) {
            $filtered = $gallery
                ->filter(fn (array $row): bool => self::rowMatchesOccasion($row, $normalized))
                ->values()
                ->all();
            if ($filtered !== []) {
                return $filtered;
            }
        }

        return $gallery->values()->all();
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private static function rowMatchesOccasion(array $row, string $slug): bool
    {
        $occasion = DesignGallery::occasion($slug);
        $canonical = is_array($occasion) ? (string) ($occasion['slug'] ?? $slug) : $slug;
        $profile = is_array($occasion) ? (string) ($occasion['profile'] ?? '') : '';
        $eventType = (string) ($row['event_type'] ?? '');
        $id = (string) ($row['id'] ?? '');

        if ($eventType === $canonical || ($profile !== '' && $eventType === $profile)) {
            // Shared profiles (e.g. party + bridal-shower → social) must still match id prefix.
            if ($profile !== '' && $eventType === $profile && $profile !== $canonical) {
                return str_starts_with($id, $canonical.'-');
            }

            return true;
        }

        return str_starts_with($id, $canonical.'-')
            || ($canonical === 'baby-shower' && ($eventType === 'baby' || str_starts_with($id, 'floral-baby')));
    }

    /**
     * Preferred template id from the event settings / saved document.
     */
    public static function templateIdFor(Wedding $wedding): ?string
    {
        $wedding->loadMissing('setting', 'card');
        $fromDocument = is_string($wedding->card?->document['template'] ?? null)
            ? $wedding->card->document['template']
            : null;
        $fromSettings = is_string($wedding->setting?->details['card_template'] ?? null)
            ? $wedding->setting->details['card_template']
            : null;

        foreach ([$fromDocument, $fromSettings] as $candidate) {
            if (is_string($candidate) && $candidate !== '' && $candidate !== 'none') {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    public static function document(Wedding $wedding, ?string $templateId, bool $includeQr, ?string $formatOverride = null): array
    {
        $wedding->loadMissing(['hosts', 'setting', 'events', 'eventType']);
        $slug = $wedding->eventType?->slug ?? 'wedding';
        $template = self::resolve($templateId, $slug);
        $format = is_string($formatOverride) && $formatOverride !== ''
            ? $formatOverride
            : ($template['format'] ?? 'invite');
        $preset = self::canvasForTemplate($template, $format);

        return self::invitationDocument($wedding, $template, $preset, $includeQr);
    }

    /** Layout version — bump when invitationDocument structure/sizing changes. */
    public const LAYOUT_VERSION = 6;

    /**
     * Layout mirrors InvitationCardFace blank-center copy trees, safe insets,
     * panel-/face-relative type (cqh), and fitScale so editor === gallery preview.
     *
     * @param  array<string, mixed>  $template
     * @param  array{format: string, width: int, height: int, label: string}  $preset
     * @return array<string, mixed>
     */
    private static function invitationDocument(Wedding $wedding, array $template, array $preset, bool $includeQr): array
    {
        $copy = InvitationCopy::fromWedding($wedding);
        $art = is_string($template['image'] ?? null) ? $template['image'] : null;
        $hasArt = filled($art);
        $kind = self::templateOccasionSlug($template);
        $styleKey = is_string($template['style'] ?? null) ? $template['style'] : null;
        $sectioned = in_array($kind, ['party', 'graduation', 'bridal-shower', 'housewarming', 'corporate', 'custom'], true);
        $overlayInvite = in_array($kind, ['birthday', 'baby-shower'], true) || $sectioned;

        // Blank-center gallery arts: dark ink. Custom photo wash: light ink.
        $ink = $kind === 'custom'
            ? '#f4efe6'
            : ($hasArt ? '#241c16' : ($template['ink'] ?? '#1c1712'));
        $gold = is_string($template['gold'] ?? null) && $template['gold'] !== ''
            ? $template['gold']
            : (($ink === '#f4efe6') ? '#e2b15a' : '#b48a4a');
        if ($hasArt && $ink !== '#f4efe6' && $kind !== 'custom') {
            $gold = self::mixHex($gold, '#241c16', 0.28);
        }
        $muted = ($ink === '#f4efe6') ? '#d9cbb8' : '#6b5d4e';
        $paper = $template['background'] ?? '#f4efe6';
        $url = route('weddings.public', ['slug' => $wedding->slug]);

        if (in_array($kind, self::containArtOccasions(), true) || $kind === 'custom') {
            [$topPct, $rightPct, $bottomPct, $leftPct] = CardSafeZones::inset($kind, $styleKey, true);
        } else {
            [$topPct, $rightPct, $bottomPct, $leftPct] = [16.5, 18.0, 15.5, 18.0];
        }

        $wellTop = (int) round($preset['height'] * ($topPct / 100));
        $wellBottom = (int) round($preset['height'] * ($bottomPct / 100));
        $padLeft = (int) round($preset['width'] * ($leftPct / 100));
        $padRight = (int) round($preset['width'] * ($rightPct / 100));
        $pad = $padLeft;
        $width = max(200, $preset['width'] - $padLeft - $padRight);
        $floor = $preset['height'] - $wellBottom;
        $panelH = max(1, $floor - $wellTop);
        // Birthday + wedding size type from the full face; sectioned/baby from the blank panel
        // (InvitationCardFace sets container-type:size on those safe wells).
        $usePanelCqh = in_array($kind, ['baby-shower', 'party', 'graduation', 'bridal-shower', 'housewarming', 'corporate', 'custom'], true);
        $cqhUnit = ($usePanelCqh ? $panelH : $preset['height']) / 100.0;
        $cq = static function (float $n, ?int $minPx = null, ?int $maxPx = null) use ($cqhUnit): int {
            $px = (int) round($n * $cqhUnit);
            if ($minPx !== null) {
                $px = max($minPx, $px);
            }
            if ($maxPx !== null) {
                $px = min($maxPx, $px);
            }

            return max(8, $px);
        };
        $lineBox = static function (int $fontSize, float $lineHeight = 1.3, int $lines = 1, int $padY = 4): int {
            return max($fontSize + $padY, (int) round($fontSize * $lineHeight * max(1, $lines)));
        };
        $estimateLines = static function (string $text, int $fontSize, int $boxWidth): int {
            $parts = preg_split("/\R/u", $text) ?: [$text];
            $total = 0;
            $charsPerLine = max(8, (int) floor($boxWidth / max(6, $fontSize * 0.48)));
            foreach ($parts as $part) {
                $len = max(1, mb_strlen(trim($part)));
                $total += max(1, (int) ceil($len / $charsPerLine));
            }

            return max(1, $total);
        };

        $cursor = 0;
        /** @var array<int, array<int, array<string, mixed>>> */
        $blocks = [];
        $block = [];

        $flushBlock = function () use (&$blocks, &$block): void {
            if ($block !== []) {
                $blocks[] = $block;
                $block = [];
            }
        };

        $pushText = function (
            string $id,
            ?string $text,
            int $fontSize,
            int $boxHeight,
            string $color,
            int $gap = 6,
            array $extra = [],
            bool $sameBlock = false,
        ) use (&$block, &$flushBlock, &$cursor, $pad, $width): void {
            $text = trim((string) $text);

            if ($text === '') {
                return;
            }

            if (! $sameBlock) {
                $flushBlock();
            }

            $block[] = array_merge(
                self::text($id, $text, $pad, $cursor, $width, $boxHeight, $fontSize, $color),
                $extra,
            );
            $cursor += $boxHeight + $gap;
        };

        $pushRule = function () use (&$block, &$flushBlock, &$cursor, $preset, $gold, $cq): void {
            $flushBlock();
            $ruleWidth = max(48, $cq(12));
            $ruleHeight = max(2, (int) round($cq(0.35)));
            $block[] = [
                'id' => 'rule',
                'type' => 'shape',
                'x' => (int) (($preset['width'] - $ruleWidth) / 2),
                'y' => $cursor + max(2, (int) round($cq(0.4))),
                'width' => $ruleWidth,
                'height' => $ruleHeight,
                'background' => $gold,
                'rotation' => 0,
            ];
            $cursor += max(14, (int) round($cq(2.2)));
            $flushBlock();
        };

        $line = static function (?string $value): ?string {
            $text = trim((string) $value);

            return $text !== '' ? $text : null;
        };

        if ($overlayInvite) {
            $headline = $line($copy['headline'] ?? null)
                ?? match ($kind) {
                    'housewarming' => 'Home Sweet Home!',
                    'corporate' => 'Connect, Collaborate, Celebrate!',
                    'birthday', 'party' => "You're Invited!",
                    'graduation' => 'The Caps Are Off!',
                    'bridal-shower' => 'From Miss to Mrs!',
                    'baby-shower' => 'A New Adventure Begins!',
                    default => 'You\'re Invited!',
                };
            $showHeadline = ! ($kind === 'party' && $styleKey === 'confetti-flags');

            if ($showHeadline) {
                $hSize = match ($kind) {
                    'baby-shower' => $cq(11.5),
                    'party', 'graduation', 'bridal-shower' => $cq(7.6),
                    'housewarming' => $cq(7.4),
                    'corporate' => $cq(7.8),
                    'custom' => $cq(8.0),
                    // Birthday: pure face cqh (no rem clamp) so scaled CardCanvas matches InvitationCardFace proportions.
                    default => $cq(6.4),
                };
                $hLines = $estimateLines($headline, $hSize, $width);
                $pushText(
                    'headline',
                    $headline,
                    $hSize,
                    $lineBox($hSize, match ($kind) {
                        'baby-shower' => 1.18,
                        'party', 'graduation', 'bridal-shower' => 1.12,
                        default => 1.1,
                    }, $hLines, 6),
                    $ink,
                    max(4, (int) round($cq(0.55))),
                    ['fontWeight' => 500, 'fontStyle' => 'italic'],
                );
            }

            $request = $line($copy['request_line'] ?? null);
            if ($request) {
                $rSize = match ($kind) {
                    'baby-shower' => $cq(5.4),
                    'party', 'graduation', 'bridal-shower' => $cq(3.7),
                    'housewarming' => $cq(3.9),
                    'corporate' => $cq(4.1),
                    'custom' => $cq(3.9),
                    default => $cq(2.25),
                };
                $rLines = $estimateLines($request, $rSize, $width);
                $pushText(
                    'request',
                    $request,
                    $rSize,
                    $lineBox($rSize, 1.3, $rLines, 4),
                    $muted,
                    max(4, (int) round($cq(0.55))),
                );
            }

            $pushRule();

            $dSize = match ($kind) {
                'baby-shower' => $cq(5.4),
                'party', 'graduation', 'bridal-shower' => $cq(3.7),
                'housewarming' => $cq(3.9),
                'corporate' => $cq(4.1),
                'custom' => $cq(3.9),
                default => $cq(2.15),
            };
            $dGap = max(2, (int) round($cq(match ($kind) {
                'baby-shower' => 0.9,
                default => 0.35,
            })));
            $dBox = fn (string $text): int => $lineBox($dSize, match ($kind) {
                'baby-shower' => 1.5,
                default => 1.3,
            }, $estimateLines($text, $dSize, $width), 2);

            if ($sectioned) {
                $headlineSub = $line($copy['headline_sub'] ?? null);
                if ($headlineSub) {
                    $pushText('headline-sub', $headlineSub, max(8, (int) round($dSize * 0.92)), $dBox($headlineSub), $ink, $dGap, ['fontWeight' => 600, 'letterSpacing' => 2], true);
                }
                $dateLabel = $line($copy['date_label'] ?? null);
                if ($dateLabel) {
                    $pushText('date', $dateLabel, $dSize, $dBox($dateLabel), $ink, $dGap, ['fontWeight' => 500], true);
                }
                $time = $line($copy['ceremony_time'] ?? null);
                if ($time) {
                    $pushText('ceremony', $time, $dSize, $dBox($time), $ink, $dGap, ['fontWeight' => 500], true);
                }
                if ($kind === 'custom') {
                    $locParts = array_values(array_unique(array_filter([
                        $line($copy['venue_name'] ?? null),
                        $line($copy['venue_address'] ?? null) ?? $line($copy['where'] ?? null),
                    ])));
                    if ($locParts !== []) {
                        $loc = '📍 '.implode(', ', $locParts);
                        $pushText('venue', $loc, $dSize, $dBox($loc), $ink, $dGap, ['fontWeight' => 500], true);
                    }
                }
                $gift = $line($copy['gift_note'] ?? null);
                if ($gift) {
                    $pushText('gift', $gift, max(8, (int) round($dSize * 0.92)), $dBox($gift), $ink, $dGap, ['fontWeight' => 600, 'letterSpacing' => 2], true);
                }
                $dress = $line($copy['dress_code'] ?? null);
                if ($dress) {
                    $pushText('dress', $dress, $dSize, $dBox($dress), $muted, $dGap, ['fontWeight' => 500], true);
                }
                $rsvp = $line($copy['rsvp_line'] ?? null);
                if ($rsvp) {
                    $pushText('rsvp', $rsvp, $dSize, $dBox($rsvp), $ink, $dGap, ['fontWeight' => 500], true);
                }
                $flushBlock();
            } else {
                $dateLabel = $line($copy['date_label'] ?? null);
                if ($dateLabel) {
                    $pushText('date', 'Date: '.$dateLabel, $dSize, $dBox('Date: '.$dateLabel), $ink, $dGap, ['fontWeight' => 500], true);
                }
                $time = $line($copy['ceremony_time'] ?? null);
                if ($time) {
                    $pushText('ceremony', 'Time: '.$time, $dSize, $dBox('Time: '.$time), $ink, $dGap, ['fontWeight' => 500], true);
                }
                if ($kind === 'baby-shower') {
                    $spot = $line($copy['venue_name'] ?? null);
                    if ($spot) {
                        $pushText('venue', 'Spot: '.$spot, $dSize, $dBox('Spot: '.$spot), $ink, $dGap, ['fontWeight' => 500], true);
                    }
                    $loc = $line($copy['venue_address'] ?? null);
                    if ($loc) {
                        $pushText('address', 'Loc: '.$loc, $dSize, $dBox('Loc: '.$loc), $ink, $dGap, ['fontWeight' => 500], true);
                    }
                } else {
                    $locParts = array_filter([
                        $line($copy['venue_name'] ?? null),
                        $line($copy['venue_address'] ?? null),
                    ]);
                    $loc = $locParts !== [] ? implode(', ', $locParts) : $line($copy['where'] ?? null);
                    if ($loc) {
                        $pushText('venue', 'Location: '.$loc, $dSize, $dBox('Location: '.$loc), $ink, $dGap, ['fontWeight' => 500], true);
                    }
                }
                $rsvp = $line($copy['rsvp_line'] ?? null);
                if ($rsvp) {
                    $rsvpText = preg_replace('/^RSVP:\s*/i', 'RSVP: ', $rsvp) ?: $rsvp;
                    $pushText('rsvp', $rsvpText, $dSize, $dBox($rsvpText), $ink, $dGap, ['fontWeight' => 500], true);
                }
                $flushBlock();
            }

            $compliments = $line($copy['compliments'] ?? null);
            if ($compliments) {
                $cSize = match ($kind) {
                    'corporate' => $cq(4.0),
                    'custom' => $cq(3.8),
                    default => $cq(2.2),
                };
                $pushText(
                    'compliments',
                    $compliments,
                    $cSize,
                    $lineBox($cSize, 1.25, $estimateLines($compliments, $cSize, $width), 4),
                    $gold,
                    max(4, (int) round($cq(0.4))),
                    ['fontStyle' => 'italic'],
                );
            }

            // InvitationCardFace: birthday (full) can show a map QR; baby-shower/sectioned omit it.
            if ($kind === 'birthday') {
                $mapUrl = is_string($copy['map_url'] ?? null) ? $copy['map_url'] : null;
                if ($mapUrl) {
                    $flushBlock();
                    $mapSize = max(56, (int) round($cq(8.5)));
                    $block[] = self::qr('map-qr', $mapUrl, (int) (($preset['width'] - $mapSize) / 2), $cursor, $mapSize);
                    $cursor += $mapSize + max(2, (int) round($cq(0.4)));
                    $block[] = self::text('map-label', 'Scan for map', $pad, $cursor, $width, max(16, (int) round($cq(2))), max(10, (int) round($cq(1.8))), $gold);
                    $cursor += max(20, (int) round($cq(2.4)));
                    $flushBlock();
                }
            }
        } else {
            // Wedding (and any non-overlay) — kicker → names → request → rule → dateboard/date → …
            $kicker = $line($copy['blessing'] ?? null)
                ?? $line($copy['kicker'] ?? null)
                ?? 'You Are Invited To';
            $pushText(
                'blessing',
                $kicker,
                $cq(2.15),
                $lineBox($cq(2.15), 1.2, 1, 4),
                $gold,
                max(6, (int) round($cq(0.8))),
                ['letterSpacing' => 5, 'fontWeight' => 500],
            );

            $bride = $line($copy['bride'] ?? null);
            $groom = $line($copy['groom'] ?? null);
            if ($kind === 'wedding' && $bride && $groom) {
                $names = trim($bride.' & '.$groom);
                $nSize = $cq(8.4);
                $pushText('names', $names, $nSize, $lineBox($nSize, 0.95, $estimateLines($names, $nSize, $width), 8), $ink, max(6, (int) round($cq(0.9))), ['fontWeight' => 500]);
            } else {
                $title = $line($copy['hosts'] ?? null) ?? $wedding->displayTitle();
                $nSize = $cq(8.4);
                $pushText('title', $title, $nSize, $lineBox($nSize, 0.95, $estimateLines($title, $nSize, $width), 8), $ink, max(6, (int) round($cq(0.9))), ['fontWeight' => 500]);
            }

            $request = $line($copy['request_line'] ?? null);
            if ($request) {
                $rSize = $cq(2.45);
                $pushText('request', $request, $rSize, $lineBox($rSize, 1.28, $estimateLines($request, $rSize, $width), 4), $muted, max(6, (int) round($cq(0.8))));
            }

            $pushRule();

            $dateLabel = $line($copy['date_label'] ?? null);
            if (! $dateLabel && filled($wedding->starts_on)) {
                $dateLabel = $wedding->starts_on->format('l, F j, Y');
            }
            $dateParts = null;
            if ($dateLabel && preg_match('/^(?:([A-Za-z]+),\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/', $dateLabel, $m)) {
                $dateParts = ['weekday' => $m[1] ?? null, 'day' => $m[2], 'month' => $m[3], 'year' => $m[4]];
            }

            if ($dateParts) {
                $flushBlock();
                $monthSize = $cq(2.1);
                $daySize = $cq(8.8);
                $yearSize = $cq(2.1);
                $block[] = array_merge(self::text('date-month', $dateParts['month'], $pad, $cursor, $width, $lineBox($monthSize), $monthSize, $muted), ['letterSpacing' => 3]);
                $cursor += $lineBox($monthSize) + 2;
                $block[] = array_merge(self::text('date-day', $dateParts['day'], $pad, $cursor, $width, $lineBox($daySize, 0.95, 1, 4), $daySize, $ink), ['fontWeight' => 500]);
                $cursor += $lineBox($daySize, 0.95, 1, 4) + 2;
                $block[] = self::text('date-year', $dateParts['year'], $pad, $cursor, $width, $lineBox($yearSize), $yearSize, $muted);
                $cursor += $lineBox($yearSize) + max(4, (int) round($cq(0.5)));
                $flushBlock();
            } elseif ($dateLabel) {
                $pushText('date', $dateLabel, $cq(2.4), $lineBox($cq(2.4)), $muted, 4);
            }

            $ceremony = $line($copy['ceremony_time'] ?? null);
            if ($ceremony) {
                $tSize = $cq(2.2);
                $pushText('ceremony', $ceremony, $tSize, $lineBox($tSize), $muted, 4);
            }

            $venue = $line($copy['venue_name'] ?? null) ?? $line($copy['where'] ?? null);
            if ($venue) {
                $vSize = $cq(2.95);
                $pushText('venue', $venue, $vSize, $lineBox($vSize, 1.2, $estimateLines($venue, $vSize, $width)), $ink, 2, ['fontWeight' => 500]);
            }
            $address = $line($copy['venue_address'] ?? null);
            if ($address) {
                $aSize = $cq(2.2);
                $pushText('address', $address, $aSize, $lineBox($aSize, 1.25, $estimateLines($address, $aSize, $width)), $muted, 4);
            }
            $reception = $line($copy['reception_time'] ?? null);
            if ($kind === 'wedding' && $reception) {
                $pushText('reception', $reception, $cq(2.2), $lineBox($cq(2.2)), $muted, 4);
            }

            if (! $hasArt) {
                $pushText('rsvp', $copy['rsvp_line'] ?? null, $cq(2.0, 8, 13), $lineBox($cq(2.0, 8, 13)), $ink, 2);
                $pushText('dress', $copy['dress_code'] ?? null, $cq(1.9, 8, 12), $lineBox($cq(1.9, 8, 12)), $muted, 2);
                $pushText('hashtag', $copy['hashtag'] ?? null, $cq(2.0, 8, 13), $lineBox($cq(2.0, 8, 13)), $gold, 4);
                $mapUrl = is_string($copy['map_url'] ?? null) ? $copy['map_url'] : null;
                if ($mapUrl) {
                    $flushBlock();
                    $mapSize = max(72, (int) round($preset['width'] * 0.12));
                    $block[] = self::qr('map-qr', $mapUrl, (int) (($preset['width'] - $mapSize) / 2), $cursor, $mapSize);
                    $cursor += $mapSize + 4;
                    $block[] = self::text('map-label', 'Scan for map', $pad, $cursor, $width, 24, 13, $gold);
                    $cursor += 28;
                    $flushBlock();
                }
                if ($includeQr) {
                    $flushBlock();
                    $qrSize = max(80, (int) round($preset['width'] * 0.14));
                    $block[] = self::qr('qr', $url, (int) (($preset['width'] - $qrSize) / 2), $cursor, $qrSize);
                    $cursor += $qrSize + 4;
                    $block[] = self::text('scan', 'Scan to open the invitation', $pad, $cursor, $width, 28, 13, $gold);
                    $cursor += 32;
                    $flushBlock();
                }
            }
        }

        $flushBlock();

        $available = max(0, $floor - $wellTop);
        $blockHeights = [];
        foreach ($blocks as $items) {
            $top = null;
            $bottom = null;
            foreach ($items as $element) {
                $topY = (int) ($element['y'] ?? 0);
                $bottomY = $topY + max(1, (int) ($element['height'] ?? 0));
                $top = $top === null ? $topY : min($top, $topY);
                $bottom = $bottom === null ? $bottomY : max($bottom, $bottomY);
            }
            $blockHeights[] = max(1, ($bottom ?? 0) - ($top ?? 0));
        }
        $contentHeight = array_sum($blockHeights);
        $count = count($blocks);
        $elements = [];

        // InvitationCardFace fitScale cushion by occasion.
        $freeScale = in_array($kind, ['baby-shower', 'party', 'graduation', 'bridal-shower', 'housewarming', 'corporate', 'custom'], true);
        $cushion = $sectioned ? 0.82 : ($freeScale ? 0.9 : 0.97);
        $fitScale = 1.0;
        if ($contentHeight > 8 && $available > 8) {
            $ratio = ($available / $contentHeight) * $cushion;
            $fitScale = min(1.0, $ratio);
            if (! $freeScale) {
                $fitScale = max(0.78, $fitScale);
            }
        }

        if ($count > 0) {
            $scaledHeights = array_map(static fn (int $h): int => max(1, (int) round($h * $fitScale)), $blockHeights);
            $scaledContent = array_sum($scaledHeights);
            $gap = max(2, (int) round(6 * $fitScale));
            if ($available > $scaledContent && $count > 1 && $fitScale >= 0.98) {
                $maxGap = max(4, (int) round($panelH * 0.02));
                $gap = (int) floor(($available - $scaledContent) / ($count + 1));
                $gap = max(2, min($maxGap, $gap));
            }
            $stackHeight = $scaledContent + ($gap * max(0, $count - 1));
            $yPos = $wellTop + (int) max(0, floor(($available - $stackHeight) / 2));

            foreach ($blocks as $index => $items) {
                $origin = null;
                foreach ($items as $element) {
                    $origin = $origin === null ? (int) ($element['y'] ?? 0) : min($origin, (int) ($element['y'] ?? 0));
                }
                $origin = $origin ?? 0;
                foreach ($items as $element) {
                    $relY = (int) ($element['y'] ?? 0) - $origin;
                    $element['y'] = $yPos + (int) round($relY * $fitScale);
                    $element['height'] = max(1, (int) round(((int) ($element['height'] ?? 1)) * $fitScale));
                    if (isset($element['fontSize'])) {
                        $element['fontSize'] = max(8, (int) round(((int) $element['fontSize']) * $fitScale));
                    }
                    if (($element['type'] ?? '') === 'shape') {
                        $element['width'] = max(2, (int) round(((int) ($element['width'] ?? 1)) * $fitScale));
                        // Keep rule centered after width scale.
                        if (($element['id'] ?? '') === 'rule') {
                            $element['x'] = (int) (($preset['width'] - (int) $element['width']) / 2);
                        }
                    }
                    $elements[] = $element;
                }
                $yPos += $scaledHeights[$index] + $gap;
            }
        }

        return [
            'background' => $paper,
            'backgroundImage' => $art,
            'template' => $template['id'] ?? 'elegant-wedding',
            'layout_version' => self::LAYOUT_VERSION,
            'occasion' => $kind,
            'elements' => $elements,
        ];
    }

    /**
     * Approximate CSS color-mix for invitation accents.
     */
    private static function mixHex(string $from, string $toward, float $towardWeight): string
    {
        $parse = static function (string $hex): array {
            $hex = ltrim($hex, '#');
            if (strlen($hex) === 3) {
                $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
            }

            return [
                hexdec(substr($hex, 0, 2)),
                hexdec(substr($hex, 2, 2)),
                hexdec(substr($hex, 4, 2)),
            ];
        };

        try {
            [$fr, $fg, $fb] = $parse($from);
            [$tr, $tg, $tb] = $parse($toward);
        } catch (\Throwable) {
            return $from;
        }

        $w = max(0, min(1, $towardWeight));
        $r = (int) round($fr * (1 - $w) + $tr * $w);
        $g = (int) round($fg * (1 - $w) + $tg * $w);
        $b = (int) round($fb * (1 - $w) + $tb * $w);

        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }

    /**
     * @return array<string, mixed>
     */
    private static function qr(string $id, string $text, int $x, int $y, int $size): array
    {
        return [
            'id' => $id,
            'type' => 'qr',
            'text' => $text,
            'x' => $x,
            'y' => $y,
            'width' => $size,
            'height' => $size,
            'rotation' => 0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function text(string $id, string $text, int $x, int $y, int $width, int $height, int $size, string $color): array
    {
        return [
            'id' => $id,
            'type' => 'text',
            'text' => $text,
            'x' => $x,
            'y' => $y,
            'width' => $width,
            'height' => $height,
            'fontSize' => $size,
            'color' => $color,
            'align' => 'center',
            'font' => 'serif',
            'rotation' => 0,
        ];
    }
}
