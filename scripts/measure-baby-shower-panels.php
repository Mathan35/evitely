<?php

/**
 * Find the largest low-busy rectangle per baby-shower blank art and emit inset %.
 * Tuned for blank-center + ornate-frame cards (allows asymmetric left/right).
 */
$dir = __DIR__.'/../public/images/gallery/baby-shower/blank';
$keys = [
    'woodland', 'cloudland', 'olive', 'terracotta', 'safari', 'celestial', 'minimal-teddy', 'balloon',
    'eucalyptus', 'stars', 'jungle', 'retro-love', 'picnic', 'giraffe', 'floral-bloom', 'geometric',
    'ocean', 'forest', 'sage', 'watercolor',
];

function lum(int $r, int $g, int $b): float
{
    return (0.2126 * $r + 0.7152 * $g + 0.0722 * $b) / 255;
}

function sat(int $r, int $g, int $b): float
{
    $mx = max($r, $g, $b);
    $mn = min($r, $g, $b);

    return $mx === 0 ? 0.0 : ($mx - $mn) / $mx;
}

$out = [];

foreach ($keys as $key) {
    $path = $dir.'/card-'.$key.'-mobile.jpg';
    $im = @imagecreatefromjpeg($path);
    if (! $im) {
        fwrite(STDERR, "FAIL {$key}\n");

        continue;
    }

    $w = imagesx($im);
    $h = imagesy($im);
    $sw = 80;
    $sh = (int) max(120, round(80 * $h / $w));
    $tmp = imagecreatetruecolor($sw, $sh);
    imagecopyresampled($tmp, $im, 0, 0, 0, 0, $sw, $sh, $w, $h);

    $busy = [];
    for ($y = 0; $y < $sh; $y++) {
        for ($x = 0; $x < $sw; $x++) {
            $rgb = imagecolorat($tmp, $x, $y);
            $r = ($rgb >> 16) & 255;
            $g = ($rgb >> 8) & 255;
            $b = $rgb & 255;
            $l = lum($r, $g, $b);
            $s = sat($r, $g, $b);
            $var = 0.0;
            $n = 0;
            for ($dy = -1; $dy <= 1; $dy++) {
                for ($dx = -1; $dx <= 1; $dx++) {
                    $xx = min($sw - 1, max(0, $x + $dx));
                    $yy = min($sh - 1, max(0, $y + $dy));
                    $c = imagecolorat($tmp, $xx, $yy);
                    $var += abs(lum(($c >> 16) & 255, ($c >> 8) & 255, $c & 255) - $l);
                    $n++;
                }
            }
            $var /= max(1, $n);
            // Soft panels stay calm; florals/figures are busy.
            $busy[$y][$x] = ($var > 0.028 || $s > 0.28 || $l < 0.12 || $l > 0.97) ? 1 : 0;
        }
    }

    $best = null;
    $bestScore = -1.0;

    for ($top = (int) ($sh * 0.06); $top < (int) ($sh * 0.45); $top += 1) {
        for ($bottom = $sh - 1 - (int) ($sh * 0.08); $bottom > (int) ($sh * 0.55); $bottom -= 1) {
            $hh = $bottom - $top;
            if ($hh < (int) ($sh * 0.22)) {
                continue;
            }
            for ($left = (int) ($sw * 0.04); $left < (int) ($sw * 0.55); $left += 1) {
                for ($right = $sw - 1 - (int) ($sw * 0.04); $right > (int) ($sw * 0.45); $right -= 1) {
                    $ww = $right - $left;
                    if ($ww < (int) ($sw * 0.28)) {
                        continue;
                    }

                    $cells = 0;
                    $busyCount = 0;
                    for ($y = $top; $y <= $bottom; $y += 1) {
                        for ($x = $left; $x <= $right; $x += 1) {
                            $cells++;
                            $busyCount += $busy[$y][$x];
                        }
                    }
                    $ratio = $busyCount / max(1, $cells);
                    if ($ratio > 0.08) {
                        continue;
                    }

                    // Prefer large, tall text panels; slight preference for vertically centered.
                    $area = $ww * $hh;
                    $cy = ($top + $bottom) / 2 / $sh;
                    $centerBias = 1.0 - abs($cy - 0.45) * 0.35;
                    $score = $area * (1.0 - $ratio * 3.0) * $centerBias;

                    if ($score > $bestScore) {
                        $bestScore = $score;
                        $best = [$left, $top, $right, $bottom, $ratio, $area];
                    }
                }
            }
        }
    }

    imagedestroy($tmp);
    imagedestroy($im);

    if (! $best) {
        $out[$key] = [24, 18, 34, 18];
        echo "{$key}: FALLBACK\n";

        continue;
    }

    [$l, $t, $r, $b] = $best;
    // Shrink panel by 6% so copy clears paws / frame edges.
    $padX = max(2, (int) round(($r - $l) * 0.06));
    $padY = max(2, (int) round(($b - $t) * 0.06));
    $l += $padX;
    $r -= $padX;
    $t += $padY;
    $b -= $padY;

    $topPct = round(($t / $sh) * 100, 1);
    $rightPct = round((($sw - 1 - $r) / $sw) * 100, 1);
    $bottomPct = round((($sh - 1 - $b) / $sh) * 100, 1);
    $leftPct = round(($l / $sw) * 100, 1);

    // Usable invitation ranges (allow strong asymmetry).
    $topPct = max(12, min(36, $topPct));
    $bottomPct = max(16, min(42, $bottomPct));
    $leftPct = max(8, min(48, $leftPct));
    $rightPct = max(8, min(40, $rightPct));

    $out[$key] = [$topPct, $rightPct, $bottomPct, $leftPct];
    echo sprintf(
        "%s => [%.1f, %.1f, %.1f, %.1f] busy=%.1f%%\n",
        $key,
        $topPct,
        $rightPct,
        $bottomPct,
        $leftPct,
        ($best[4] ?? 0) * 100
    );
}

file_put_contents(__DIR__.'/baby-shower-panels.json', json_encode($out, JSON_PRETTY_PRINT));
echo "wrote scripts/baby-shower-panels.json\n";
